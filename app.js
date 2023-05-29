const express = require("express");
const path = require("path");

const { open } = require("sqlite");
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
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertMatchDbObjectToResponseObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

//api-1
app.get("/players/", async (request, response) => {
  const getAllPlayers = `
    select * from player_details;`;
  const players = await db.all(getAllPlayers);
  response.send(players.map((each) => convertDbObjectToResponseObject(each)));
});

//api-2
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    select * from player_details where player_id = ${playerId};`;

  const player = await db.get(getPlayerQuery);
  response.send(convertDbObjectToResponseObject(player));
});

//api-3
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;

  const { playerName } = playerDetails;

  const updatePlayerQuery = `
    update 
        player_details 
    set
        player_name = '${playerName}'
    where 
        player_id = ${playerId};
    `;
  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

//api-4
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
    select * from match_details where match_id = ${matchId};`;

  const match = await db.get(getMatchQuery);
  response.send(convertMatchDbObjectToResponseObject(match));
});
//api-5
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    select * from player_match_score
    natural join 
    match_details where player_id = ${playerId};`;

  const player = await db.all(getPlayerQuery);
  response.send(
    player.map((each) => convertMatchDbObjectToResponseObject(each))
  );
});

//api-6
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
    select * from player_match_score
    natural join player_details where match_id = ${matchId};`;

  const match = await db.all(getMatchQuery);
  response.send(match.map((each) => convertDbObjectToResponseObject(each)));
});

//api-7
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getTotalScoresQuery = `
    SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes FROM 
    player_details INNER JOIN player_match_score ON
    player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = ${playerId};
    `;

  const scoreDetails = await db.get(getTotalScoresQuery);
  response.send(scoreDetails);
});
module.exports = app;
