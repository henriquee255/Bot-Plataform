async function verifyLogin() {
    try {
        console.log('Attempting login...');
        const response = await fetch('http://localhost:3001/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'eu.henriquee2501@gmail.com',
                password: '12345678'
            })
        });

        if (!response.ok) {
            const text = await response.text();
            console.error(`Login Failed: ${response.status} ${response.statusText}`);
            console.error('Response:', text);
            return;
        }

        const data = await response.json();
        console.log('Login Successful!');
        console.log('User Role:', data.user.role);
        console.log('Is Superadmin:', data.user.is_superadmin);
    } catch (error) {
        console.error('Network/Script Error:', error);
    }
}

verifyLogin();
