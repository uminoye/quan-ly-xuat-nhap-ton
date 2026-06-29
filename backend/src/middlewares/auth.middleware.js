const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    let token = req.headers['authorization'];
    if (!token) return res.status(403).json({ message: 'Khong tim thay Token xac thuc' });

    try {
        // Support both "Bearer <token>" and plain "<token>" formats
        token = token.trim();
        const parts = token.split(' ');
        const tokenBody = parts.length > 1 ? parts[parts.length - 1] : parts[0];
        const decoded = jwt.verify(
            tokenBody,
            process.env.JWT_SECRET || 'KHOA_BIMAT_CUA_DU_AN_XUAT_NHAP_TON'
        );
        req.userId = decoded.id;
        req.userRole = decoded.role_id;
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Token khong hop le hoac da het han: ' + error.message });
    }
};

module.exports = { verifyToken };
