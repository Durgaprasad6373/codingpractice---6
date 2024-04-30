const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const app = express()
app.use(express.json())

const path = require('path')
const dbPath = path.join(__dirname, 'covid19India.db')

let db = null

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
  } catch (e) {
    console.log(`DB Error: '${e.message}'`)
    process.exit(1)
  }
}

app.listen(3000, () => {
  console.log(`Server Running at http://localhost:3000/`)
})

const convertStateDbObjectToResponseObject = dbObject => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  }
}

const convertDistrictDBObjectToResponseObject = dbObject => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  }
}

// API 1
app.get('/states/', async (request, response) => {
  const getStatesQuery = `
    SELECT * FROM state ORDER BY state_id`

  const stateArray = await db.all(getStatesQuery)
  response.send(
    stateArray.map(eachState =>
      convertStateDbObjectToResponseObject(eachState),
    ),
  )
})

// API 2
app.get('/states/:stateId/', async (request, response) => {
  const {stateId} = request.params
  const getStateQuery = `
    SELECT * FROM state WHERE state_id = ${stateId}`

  const state = await db.get(getStateQuery)
  response.send(convertStateDbObjectToResponseObject(state))
})

// API 3
app.post('/districts/', async (request, response) => {
  const {districtId, districtName, stateId, cases, cured, active, deaths} =
    request.body

  const addDistrictQuery = `
    INSERT INTO district 
    (district_name, distict_id, state_id, cases, cured, active, deaths)
    VALUES
    ('${districtName}', '${districtId}', '${cases}', '${cured}', '${active}', '${deaths}')`

  await db.run(addDistrictQuery)
  response.send('District Successfully Added')
})

//API 4
app.get('/district/:districtId/', async (request, response) => {
  const {districtId} = request.params

  const getDistrictQuery = `
    SELECT * FROM district WHERE district_id = '${districtId}'`

  const district = await db.run(getDistrictQuery)
  response.send(convertDistrictDBObjectToResponseObject(district))
})

//API 5
app.delete('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params

  const deleteDistrictQuery = `
    DELETE FROM district WHERE district_id = '${districtId}'`

  await db.run(deleteDistrictQuery)
  response.send('District Removed')
})

//API 6
app.put('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const {districtName, stateId, cases, cured, active, deaths} = request.body

  const updateDistrictQuery = `
    UPDATE district 
    SET 
        district_name = '${districtName}',
        state_id = '${stateId}',
        cases = '${cases}',
        cured = '${cured}',
        active = '${active}',
        deaths = '${deaths}'
    WHERE 
        district_id = '${districtId}'`

  await db.run(updateDistrictQuery)
  response.send('District Details Updated')
})

//API 7
app.get('/states/:stateId/stats', async (request, response) => {
  const {stateId} = request.params
  const getDistrictStateQuery = `
    SELECT 
        SUM(cases) as totalCases,
        SUM(cured) as totalCured,
        SUM(actice) as totalActive,
        SUM(deaths) as totalDeaths
    FROM 
        district
    WHERE 
        state_id = '${stateId}'`

  const stateArray = await db.run(getDistrictStateQuery)
  response.send(stateArray)
})

//API 8
app.get('/districts/:districtId/details/', async (request, response) => {
  const {districtId} = request.params
  const getDistrictIdQuery = `
    SELECT state_name FROM state INNER JOIN district
    ON district.state_id = state.district_id`

  const result = db.run(getDistrictIdQuery)
  response.send(result)
})

module.exports = app
