async function testLive() {
    try {
        const loginRes = await fetch('https://quan-ly-xuat-nhap-ton.onrender.com/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@congty.com', password: '123' })
        });
        const loginData = await loginRes.json();
        console.log("Login Data:", loginData);
        
        let token = loginData.accessToken || loginData.token;
        if (!token && loginData.user && loginData.user.token) token = loginData.user.token;
        console.log("Token acquired:", token);

        const compRes = await fetch('https://quan-ly-xuat-nhap-ton.onrender.com/api/returns/compensations?period=month', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const compData = await compRes.json();
        console.log("Compensations Length:", compData.length);

        const retRes = await fetch('https://quan-ly-xuat-nhap-ton.onrender.com/api/returns?period=month', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const retData = await retRes.json();
        console.log("Returns Length:", retData.length);
    } catch (e) {
        console.error("Error:", e);
    }
}
testLive();
