/**
 * Mahjong Pairing Engine v1.7
 * Ported from TournamentPairingService (Ruby)
 * Smart Initialization & High Performance
 */
class PairingEngine {
    constructor(players, history = []) {
        this.players = players; // Array of { id, name, score, team_id }
        this.history = this.buildHistory(history);
        this.teamHistory = this.buildTeamHistory(history);
    }

    buildHistory(pastRounds) {
        const history = {};
        this.players.forEach(p => history[p.id] = {});
        pastRounds.forEach(round => {
            round.tables.forEach(table => {
                table.forEach(pid1 => {
                    table.forEach(pid2 => {
                        if (pid1 !== pid2) {
                            history[pid1][pid2] = (history[pid1][pid2] || 0) + 1;
                        }
                    });
                });
            });
        });
        return history;
    }

    buildTeamHistory(pastRounds) {
        const teamHistory = {};
        const getTeam = (id) => this.players.find(p => p.id === id)?.team_id;
        pastRounds.forEach(round => {
            round.tables.forEach(table => {
                for (let i = 0; i < table.length; i++) {
                    for (let j = i + 1; j < table.length; j++) {
                        const t1 = getTeam(table[i]);
                        const t2 = getTeam(table[j]);
                        if (t1 && t2 && t1 !== t2) {
                            const key = [t1, t2].sort().join('-');
                            teamHistory[key] = (teamHistory[key] || 0) + 1;
                        }
                    }
                }
            });
        });
        return teamHistory;
    }

    generateSmart() {
        let pool = [...this.players].sort(() => Math.random() - 0.5);
        let tables = [];
        let currentTable = [];

        while (pool.length > 0) {
            let foundIdx = pool.findIndex(p => 
                !currentTable.some(seated => p.team_id !== null && p.team_id === seated.team_id)
            );
            let player = pool.splice(foundIdx !== -1 ? foundIdx : 0, 1)[0];
            currentTable.push(player);
            if (currentTable.length === 4) {
                tables.push(currentTable);
                currentTable = [];
            }
        }
        return tables;
    }

    optimize(tables, iterations = 30000) {
        let currentCost = this.totalCost(tables);
        for (let i = 0; i < iterations; i++) {
            if (currentCost === 0) break;
            let t1Idx = Math.floor(Math.random() * tables.length);
            let t2Idx = Math.floor(Math.random() * tables.length);
            if (i % 3 === 0) t1Idx = this.getWorstTableIndex(tables);
            if (t1Idx === t2Idx) continue;
            let p1Idx = Math.floor(Math.random() * 4), p2Idx = Math.floor(Math.random() * 4);
            let p1 = tables[t1Idx][p1Idx], p2 = tables[t2Idx][p2Idx];
            tables[t1Idx][p1Idx] = p2; tables[t2Idx][p2Idx] = p1;
            let newCost = this.totalCost(tables);
            if (newCost <= currentCost) currentCost = newCost;
            else { tables[t1Idx][p1Idx] = p1; tables[t2Idx][p2Idx] = p2; }
        }
        return tables;
    }

    getWorstTableIndex(tables) {
        let maxCost = -1, worstIdx = 0;
        tables.forEach((t, i) => { const cost = this.tableCost(t); if (cost > maxCost) { maxCost = cost; worstIdx = i; } });
        return worstIdx;
    }

    tableCost(table) {
        let cost = 0;
        for (let i = 0; i < table.length; i++) {
            for (let j = i + 1; j < table.length; j++) {
                const p1 = table[i], p2 = table[j];
                if (this.history[p1.id]?.[p2.id]) cost += 10000000;
                if (p1.team_id !== null && p1.team_id === p2.team_id) cost += 5000000;
                if (p1.team_id !== null && p2.team_id !== null && p1.team_id !== p2.team_id) {
                    const key = [p1.team_id, p2.team_id].sort().join('-');
                    const past = this.teamHistory[key] || 0;
                    cost += Math.pow(10, past); 
                }
            }
        }
        return cost;
    }

    totalCost(tables) { return tables.reduce((sum, table) => sum + this.tableCost(table), 0); }
}
