const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    let token = req.headers['authorization'];
    if (!token) return res.status(403).json({ message: 'Khong tim thay Token xac thuc' });

    try {
        const tokenBody = token.split(' ')[1];
        const decoded = jwt.verify(
            tokenBody,
            process.env.JWT_SECRET || 'KHOA_BIMAT_CUA_DU_AN_XUAT_NHAP_TON'
        );
        req.userId = decoded.id;
        req.userRole = decoded.role_id;
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Token khong hop le hoac da het han' });
    }
};

module.exports = { verifyToken };
