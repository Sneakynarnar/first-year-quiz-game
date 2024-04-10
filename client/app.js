const btnPlay = document.querySelector('#play');

btnPlay.addEventListener('click', async() => {

    const data = {
        roomTitle: 'Test'
    };

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    };

    try {
        const res = await fetch(`/path`, options);
        if (!res.ok) {
            throw new Error('Response not OK...');
        }
        const data = await res.json();
        console.log(JSON.parse(data));
    } catch (err) {
        console.error(err);
    }
});