let rankingData = [];

fetch('gigachads-ranking.json')
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        rankingData = data.ranking;
        renderTable(rankingData);
    })
    .catch(error => {
        console.error('There has been a problem with your fetch operation:', error);
    });

function renderTable(data) {
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = ''; // Clear existing table data
    data.forEach(user => {
        const row = document.createElement('tr');
        let medal = '';

        if (user.rank === 1) {
            medal = '🥇';
        } else if (user.rank === 2) {
            medal = '🥈';
        } else if (user.rank === 3) {
            medal = '🥉';
        } else {
            medal = user.rank;
        }

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
}

// Fonction de tri
function sortTable(key) {
    rankingData.sort((a, b) => {
        const valueA = a.stats[key];
        const valueB = b.stats[key];
        return valueB - valueA; // Tri descendant
    });
    renderTable(rankingData);
}
