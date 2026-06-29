const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await db.getOne(`SELECT * FROM users WHERE email = $1`, [email]);

        if (!user) return res.status(404).json({ message: 'Tai khoan khong ton tai' });

        const passwordIsValid = bcrypt.compareSync(password, user.password_hash);
        if (!passwordIsValid) return res.status(401).json({ message: 'Sai mat khau' });

        const token = jwt.sign(
            { id: user.id, role_id: user.role_id },
            process.env.JWT_SECRET || 'KHOA_BIMAT_CUA_DU_AN_XUAT_NHAP_TON',
            { expiresIn: 86400 }
        );

        res.status(200).json({
            message: 'Dang nhap thanh cong',
            user: {
                id: user.id,
                full_name: user.full_name,
                email: user.email,
                role_id: user.role_id
            },
            accessToken: token
        });
    } catch (err) {
        res.status(500).json({ message: 'Loi may chu', error: err.message });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const rows = await db.getAll(`SELECT id, email, full_name, role_id FROM users ORDER BY id DESC`);
        res.status(200).json(rows);
    } catch (err) {
        res.status(500).json({ message: 'Loi Database: ' + err.message });
    }
};

const createUser = async (req, res) => {
    try {
        const { email, password, full_name, role_id } = req.body;
        if (!email || !password || !full_name) return res.status(400).json({ message: 'Vui long nhap du thong tin!' });

        const hashed_password = bcrypt.hashSync(password, 10);
        await db.run(
            `INSERT INTO users (email, password_hash, full_name, role_id) VALUES ($1, $2, $3, $4)`,
            [email, hashed_password, full_name, role_id || 2]
        );
        res.status(201).json({ message: 'Tao tai khoan thanh cong!' });
    } catch (err) {
        if (err.message.includes('duplicate') || err.message.includes('unique')) {
            return res.status(400).json({ message: 'Email nay da duoc su dung!' });
        }
        res.status(500).json({ message: 'Loi khi tao tai khoan' });
    }
};

const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { full_name, role_id, password } = req.body;

        let query = `UPDATE users SET full_name = $1, role_id = $2`;
        let params = [full_name, role_id];

        if (password) {
            query += `, password_hash = $3`;
            params.push(bcrypt.hashSync(password, 10));
            params.push(id);
        } else {
            params.push(id);
        }

        query += ` WHERE id = $${params.length}`;
        await db.run(query, params);
        res.status(200).json({ message: 'Cap nhat thanh cong!' });
    } catch (err) {
        res.status(500).json({ message: 'Loi khi cap nhat tai khoan' });
    }
};

const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await db.getOne(`SELECT role_id FROM users WHERE id = $1`, [id]);
        if (user && user.role_id === 1) {
            return res.status(400).json({ message: 'Tuyet doi khong duoc xoa tai khoan Admin goc!' });
        }
        await db.run(`DELETE FROM users WHERE id = $1`, [id]);
        res.status(200).json({ message: 'Da xoa tai khoan nhan vien!' });
    } catch (err) {
        res.status(500).json({ message: 'Loi khi xoa tai khoan' });
    }
};

module.exports = { login, getAllUsers, createUser, updateUser, deleteUser };
