const buildDateFilter = (period, dateField = 'created_at') => {
    let sql = '';
    switch (period) {
        case 'day': sql = `DATE(${dateField}) = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')::date`; break;
        case 'month': sql = `DATE_TRUNC('month', ${dateField}) = DATE_TRUNC('month', (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')::date)`; break;
        case 'quarter': sql = `${dateField} >= (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')::date - INTERVAL '3 months'`; break;
        case 'all': return '';
        default: sql = `DATE_TRUNC('month', ${dateField}) = DATE_TRUNC('month', (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')::date)`; break; // default is month
    }
    return `AND ${sql}`;
};

module.exports = { buildDateFilter };
