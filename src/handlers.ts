import fs from 'fs'
import axios from 'axios'
import { compile } from 'json-schema-to-typescript'
import { AxiosError } from 'axios'

const schemas: any = []

export const publishSchemas = async (appName: string, apiToken: string) => {
  traversAndCollectSchemas('./')

  const payload = {
    appName,
    jsonArray: schemas,
  }

  try {
    await axios({
      url: 'https://api.structurize.io/schemas/v1',
      method: 'POST',
      data: payload,
      headers: {
        'Authorization': apiToken,
      }
    })
  } catch(e) {
    if (e instanceof AxiosError) {
      console.log(e.response?.data)
    } else if (e instanceof Error){
      console.log('an unexpected error occurred:', e.message)
    } else {
      console.log('an unexpected error occurred')
    }

    process.exit(1)
  }
  
}

const traversAndCollectSchemas = (path: string) => {
  fs.readdirSync(path).forEach(f => {
    const info = fs.statSync(path + f)
    
    if (f.includes('structurize.json')) {
      const json = fs.readFileSync(path + f, 'utf-8')

      const parsed = JSON.parse(json)

      schemas.push(parsed);
    }

    if (info.isDirectory() && f !== 'node_modules') {
      traversAndCollectSchemas(path + f + '/')
    }
  })
}

export const importInterfaces = async (appNames: string, apiToken: string) => {
  const apps = appNames.split(',')

  const promises = apps.map(app => {
    return axios({
      url: `https://api.structurize.io/schema/v1?appName=${app.trim()}`,
      method: 'GET',
      headers: {
        'Authorization': apiToken,
      }
    })
  })

  let resolved

  try {
    resolved = await Promise.all(promises)
  } catch(e) {
    if (e instanceof AxiosError) {
      console.log(e.response?.data)
    } else if (e instanceof Error){
      console.log('an unexpected error occurred:', e.message)
    } else {
      console.log('an unexpected error occurred')
    }

    process.exit(1)
  }

  try {
    await fs.promises.rm('./structurize', { recursive: true })
  } catch {}

  fs.mkdirSync('./structurize')

  for (let appSchema of resolved) {
    const { data, data: { data: schemas } } = appSchema

    fs.appendFileSync(`./structurize/${schemas[0].appName}.ts`, '/* eslint-disable */')

    for (let el of schemas) {
      const schema = JSON.parse(el.json)
      
      const ts = await compile(schema, 'MySchema')
      
      fs.appendFileSync(`./structurize/${el.appName}.ts`, ts.slice(235))
    }
  } 

}