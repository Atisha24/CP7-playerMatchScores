const express = require("express");
const { open } = require("sqlite");
const path = require("path");
const sqlite3 = require("sqlite3");

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

const app = express();

app.use(express.json());

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertPlayerDetailsDbToResponseDb = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertMatchDetailsDbToResponseDb = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

const convertPlayerMatchScoreDbToResponseDb = (dbObject) => {
  return {
    playerMatchId: dbObject.player_match_id,
    playerId: dbObject.player_id,
    matchId: dbObject.match_id,
    score: dbObject.score,
    fours: dbObject.fours,
    sixes: dbObject.sixes,
  };
};

app.get("/players/", async (request, response) => {
  const getPlayersList = `
        SELECT *
        FROM player_details;`;
  const playerArray = await db.all(getPlayersList);
  response.send(
    playerArray.map((player) => convertPlayerDetailsDbToResponseDb(player))
  );
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerDetail = `
        SELECT *
        FROM player_details
        WHERE player_id = ${playerId};`;
  const playerDetail = await db.get(getPlayerDetail);
  response.send(convertPlayerDetailsDbToResponseDb(playerDetail));
});

app.put("/players/:playerId", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerName = `
        UPDATE player_details
        SET 
            player_name = '${playerName}'
        WHERE 
            player_id = ${playerId};`;
  await db.run(updatePlayerName);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId", async (request, response) => {
  const { matchId } = request.params;
  const getMatchDetails = `
        SELECT *
        FROM match_details
        WHERE match_id = ${matchId};`;
  const matchDetails = await db.get(getMatchDetails);
  response.send(convertMatchDetailsDbToResponseDb(matchDetails));
});

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getMatchQuery = `
        SELECT 
            *
        FROM 
           player_match_score
           NATURAL JOIN match_details 
        WHERE 
           player_id = ${playerId};`;
  const playerMatch = await db.all(getMatchQuery);
  response.send(
    playerMatch.map((match) => convertMatchDetailsDbToResponseDb(match))
  );
});

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayerQuery = `
        SELECT 
           *
        FROM 
           player_match_score
           INNER JOIN player_details 
        WHERE 
            match_id = ${matchId};`;
  const playerDetails = await db.get(getPlayerQuery);
  response.send(
    playerDetails.map((player) => convertPlayerDetailsDbToResponseDb(player))
  );
});

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerStatistics = `
        SELECT 
            player_id,
            player_name,
            SUM(score),
            SUM(fours),
            SUM(sixes)
        FROM 
            player_match_score
        WHERE 
            player_id = ${playerId};`;
  const playerStats = await db.get(getPlayerStatistics);
  response.send({
    playerId: playerStats[player_id],
    playerName: playerStats["player_name"],
    totalScore: playerStats["SUM(score)"],
    totalFours: playerStats["SUM(fours)"],
    totalSixes: playerStats["SUM(sixes)"],
  });
});

module.exports = app;
