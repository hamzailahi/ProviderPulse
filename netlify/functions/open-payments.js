const https = require('https');

const DATASET_ID = 'fb3a65aa-c901-4a38-a813-b04b00dfa2a9';

function fetchPayments(npi) {
    return new Promise((resolve, reject) => {
        // Build query string manually — URLSearchParams encodes brackets wrong for DKAN
        const qs = [
            'conditions%5B0%5D%5Bproperty%5D=covered_recipient_npi',
            `conditions%5B0%5D%5Bvalue%5D=${npi}`,
            'conditions%5B0%5D%5Boperator%5D=%3D',
            'limit=500',
            'offset=0',
            'results=true',
            'count=true',
            'schema=false',
            'keys=false',
            'properties%5B%5D=covered_recipient_npi',
            'properties%5B%5D=applicable_manufacturer_or_applicable_gpo_making_payment_name',
            'properties%5B%5D=applicable_manufacturer_or_applicable_gpo_making_payment_state',
            'properties%5B%5D=total_amount_of_payment_usdollars',
            'properties%5B%5D=date_of_payment',
            'properties%5B%5D=nature_of_payment_or_transfer_of_value',
            'properties%5B%5D=form_of_payment_or_transfer_of_value',
            'properties%5B%5D=name_of_drug_or_biological_or_device_or_medical_supply_1',
            'properties%5B%5D=product_category_or_therapeutic_area_1',
            'properties%5B%5D=indicate_drug_or_biological_or_device_or_medical_supply_1',
            'properties%5B%5D=name_of_drug_or_biological_or_device_or_medical_supply_2',
            'properties%5B%5D=product_category_or_therapeutic_area_2',
            'properties%5B%5D=name_of_drug_or_biological_or_device_or_medical_supply_3',
            'properties%5B%5D=product_category_or_therapeutic_area_3',
            'properties%5B%5D=program_year',
            'properties%5B%5D=physician_ownership_indicator',
            'properties%5B%5D=city_of_travel',
            'properties%5B%5D=country_of_travel',
        ].join('&');

        const url = `https://openpaymentsdata.cms.gov/api/1/datastore/query/${DATASET_ID}/0?${qs}`;
        console.log('Fetching:', url.substring(0, 120));

        const req = https.get(url, { headers: { 'Accept': 'application/json' } }, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log('Status:', res.statusCode, 'Body length:', data.length);
                try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
                catch(e) { resolve({ status: res.statusCode, data: null, raw: data.substring(0, 200) }); }
            });
        });
        req.on('error', e => { console.log('Request error:', e.message); reject(e); });
        req.setTimeout(20000, () => { req.destroy(); reject(new Error('Request timeout')); });
    });
}

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'GET') return { statusCode: 405, body: 'Method not allowed' };

    const npi = event.queryStringParameters?.npi;
    if (!npi) return { statusCode: 400, body: JSON.stringify({ error: 'NPI required' }) };

    console.log('Looking up NPI:', npi);

    try {
        const general = await fetchPayments(npi);

        if (!general.data) {
            console.log('No data returned, raw:', general.raw);
            return { statusCode: 200, headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ npi, total_payments: 0, total_amount: 0, by_company: [], all_payments: [], program_years: [] }) };
        }

        const results = general.data?.results || [];
        console.log('Records found:', results.length, 'Count:', general.data?.count);

        const payments = results.map(r => {
            const products = [];
            for (let i = 1; i <= 3; i++) {
                const name = r[`name_of_drug_or_biological_or_device_or_medical_supply_${i}`];
                const area = r[`product_category_or_therapeutic_area_${i}`];
                const type = r[`indicate_drug_or_biological_or_device_or_medical_supply_${i}`];
                if (name) products.push({ name, type, area });
            }
            return {
                company: r.applicable_manufacturer_or_applicable_gpo_making_payment_name || '',
                company_state: r.applicable_manufacturer_or_applicable_gpo_making_payment_state || '',
                amount: parseFloat(r.total_amount_of_payment_usdollars || 0),
                date: r.date_of_payment || '',
                nature: r.nature_of_payment_or_transfer_of_value || '',
                form: r.form_of_payment_or_transfer_of_value || '',
                products,
                program_year: r.program_year || '',
            };
        });

        const byCompany = {};
        payments.forEach(p => {
            if (!byCompany[p.company]) byCompany[p.company] = { company: p.company, total: 0, count: 0, payments: [], products: new Set() };
            byCompany[p.company].total += p.amount;
            byCompany[p.company].count++;
            byCompany[p.company].payments.push(p);
            p.products.forEach(pr => byCompany[p.company].products.add(pr.name));
        });

        const companySummary = Object.values(byCompany)
            .map(c => ({ ...c, products: [...c.products], total: Math.round(c.total * 100) / 100 }))
            .sort((a, b) => b.total - a.total);

        const totalAmount = Math.round(payments.reduce((s, p) => s + p.amount, 0) * 100) / 100;

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                npi,
                total_payments: payments.length,
                total_amount: totalAmount,
                program_years: [...new Set(payments.map(p => p.program_year).filter(Boolean))].sort().reverse(),
                by_company: companySummary,
                all_payments: payments.sort((a, b) => b.amount - a.amount)
            })
        };

    } catch(e) {
        console.log('Error:', e.message);
        return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
    }
};
