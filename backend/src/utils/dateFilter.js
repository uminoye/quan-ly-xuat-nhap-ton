const buildDateFilter = (period, dateField = 'created_at') => {
    let sql = '';
    switch (period) {
        case 'day': sql = `DATE(${dateField}) = CURRENT_DATE`; break;
        case 'month': sql = `DATE_TRUNC('month', ${dateField}) = DATE_TRUNC('month', CURRENT_DATE)`; break;
        case 'quarter': sql = `${dateField} >= CURRENT_DATE - INTERVAL '3 months'`; break;
        case 'all': return '';
        default: sql = `DATE_TRUNC('month', ${dateField}) = DATE_TRUNC('month', CURRENT_DATE)`; break; // default is month
    }
    return `AND ${sql}`;
};

module.exports = { buildDateFilter };
