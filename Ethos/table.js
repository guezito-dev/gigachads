fetch('gigachads-ranking.json')
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        const tableBody = document.getElementById('tableBody');
        data.ranking.forEach(user => {
            const row = document.createElement('tr');
            let medal = '';

            // Ajout des émoticônes de médailles pour le top 3
            if (user.rank === 1) {
                medal = '🥇'; // Médaille d'or
            } else if (user.rank === 2) {
                medal = '🥈'; // Médaille d'argent
            } else if (user.rank === 3) {
                medal = '🥉'; // Médaille de bronze
            } else {
                medal = user.rank; // Pour les autres
            }

            // Remplissage des données dans le tableau
            row.innerHTML = `
                <td>${medal}</td>
                <td>
                    <img src="${user.user.avatarUrl}" class="img-avatar" alt="${user.user.displayName}">
                    ${user.user.displayName}
                </td>
                <td>${user.stats.vouchesGiven}</td>
                <td>${user.stats.reviewsGiven}</td>
                <td>${user.stats.vouchesReceived}</td>
                <td>${user.stats.reviewsReceived}</td>
                <td>${user.stats.totalScore}</td>
                <td><a href="${user.user.profileUrl}" target="_blank">Profile</a></td>
                <td><a href="${user.user.twitterUrl}" target="_blank">X Profile</a></td>
            `;
            tableBody.appendChild(row);
        });
    })
    .catch(error => {
        console.error('There has been a problem with your fetch operation:', error);
    });
