const https = require('https');

const DATASET_ID = 'fb3a65aa-c901-4a38-a813-b04b00dfa2a9';
const BASE_URL = `https://openpaymentsdata.cms.gov/api/1/datastore/query/${DATASET_ID}/0`;

// Research payments dataset 2024
const RESEARCH_DATASET_ID = '77ab1ae8-09c5-4e44-9c12-b3a68c05ac49';

function fetchPayments(npi, dataset, limit = 500) {
    return new Promise((resolve, reject) => {
        const params = new URLSearchParams({
            'conditions[0][property]': 'covered_recipient_npi',
            'conditions[0][value]': npi,
            'conditions[0][operator]': '=',
            'limit': limit,
            'offset': 0,
            'count': 'true',
            'results': 'true',
            'schema': 'false',
            'keys': 'false'
        });
        const url = `https://openpaymentsdata.cms.gov/api/1/datastore/query/${dataset}/0?${params}`;
        https.get(url, { headers: { 'Accept': 'application/json' } }, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
                catch(e) { resolve({ status: res.statusCode, data: null }); }
            });
        }).on('error', reject);
    });
}

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'GET') return { statusCode: 405, body: 'Method not allowed' };

    const npi = event.queryStringParameters?.npi;
    if (!npi) return { statusCode: 400, body: JSON.stringify({ error: 'NPI required' }) };

    try {
        // Fetch general payments (2023 is the most recent complete year in this dataset)
        const general = await fetchPayments(npi, DATASET_ID);
        const results = general.data?.results || [];

        // Parse into clean records
        const payments = results.map(r => {
            // Collect up to 5 associated products
            const products = [];
            for (let i = 1; i <= 5; i++) {
                const name = r[`name_of_drug_or_biological_or_device_or_medical_supply_${i}`];
                const type = r[`indicate_drug_or_biological_or_device_or_medical_supply_${i}`];
                const area = r[`product_category_or_therapeutic_area_${i}`];
                if (name) products.push({ name, type, area });
            }
            return {
                record_id: r.record_id,
                company: r.applicable_manufacturer_or_applicable_gpo_making_payment_name || '',
                company_state: r.applicable_manufacturer_or_applicable_gpo_making_payment_state || '',
                amount: parseFloat(r.total_amount_of_payment_usdollars || 0),
                date: r.date_of_payment || '',
                nature: r.nature_of_payment_or_transfer_of_value || '',
                form: r.form_of_payment_or_transfer_of_value || '',
                products,
                program_year: r.program_year || '',
                physician_ownership: r.physician_ownership_indicator || 'No',
                city_of_travel: r.city_of_travel || '',
                state_of_travel: r.state_of_travel || '',
                country_of_travel: r.country_of_travel || '',
            };
        });

        // Summarize by company
        const byCompany = {};
        payments.forEach(p => {
            if (!byCompany[p.company]) byCompany[p.company] = { company: p.company, total: 0, count: 0, payments: [], products: new Set() };
            byCompany[p.company].total += p.amount;
            byCompany[p.company].count += 1;
            byCompany[p.company].payments.push(p);
            p.products.forEach(pr => byCompany[p.company].products.add(pr.name));
        });

        const companySummary = Object.values(byCompany)
            .map(c => ({ ...c, products: [...c.products], total: Math.round(c.total * 100) / 100 }))
            .sort((a, b) => b.total - a.total);

        const totalAmount = payments.reduce((s, p) => s + p.amount, 0);

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                npi,
                total_payments: payments.length,
                total_amount: Math.round(totalAmount * 100) / 100,
                program_years: [...new Set(payments.map(p => p.program_year).filter(Boolean))].sort().reverse(),
                by_company: companySummary,
                all_payments: payments.sort((a, b) => b.amount - a.amount)
            })
        };

    } catch(e) {
        return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
    }
};
