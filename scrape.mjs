import { promises as fs } from 'fs'
import _ from 'lodash'
import { JSDOM } from 'jsdom'
import xml2js from 'xml2js'

const parser = new xml2js.Parser()
const url = `https://ssl.arb.ca.gov/pfirs/firm/kml/rx4.php?s=all`
const response = await fetch(url)
const text = await response.text()
const xml = await parser.parseStringPromise(text)

const burns = xml.kml.Document[0].Placemark.map(d => {
  const name = d.name[0]
  const { coordinates } = d.Point[0]
  const coords = coordinates[0].split(',').map(d => +d)
  const description = d.description[0]
  const dom = new JSDOM(description);
  const cells = dom.window.document.body.querySelectorAll('td')
  const date = cells[1].textContent
  const managingAgency = cells[3].textContent
  const burnType = cells[5].textContent
  const acres = +cells[7].textContent.replaceAll(',', '')
  const status = cells[9].textContent
  const approvedOn = cells[11].textContent

  return {
    name,
    date,
    managingAgency,
    burnType,
    acres,
    status,
    approvedOn,
    coordinates: coords
  }
})
const sorted = _.orderBy(burns, ['date', 'name'])
const fileName = 'rx-burns.json'
await fs.writeFile(fileName, JSON.stringify(sorted, null, 2))