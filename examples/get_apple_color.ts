import axios from 'axios'
import UserAgent from 'user-agents'
import { scryptSync } from 'node:crypto'
import { join } from 'node:path'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { load } from 'cheerio'
import { unzipSync } from 'node:zlib'


// const __filename = fileURLToPath(import.meta.url);
// https://developer.apple.com/design/human-interface-guidelines/foundations/color#best-practices
const appleColorUrl = 'https://developer.apple.com/design/human-interface-guidelines/foundations/color#best-practices'
// const appleColorUrl = 'http://localhost:8081/'
async function getWebPage(force = false) {
    const userAgent = new UserAgent({ platform: "MacIntel" })
    const fileName = join(process.cwd(), 'data', scryptSync(appleColorUrl, 'salt', 32).toString('hex') + '.html')
    let htmlContent: string | Buffer = ''
    if (!force && existsSync(fileName)) {
        htmlContent = readFileSync(fileName).toString()
    } else {
        const resp = await axios.get(appleColorUrl, {
            responseType: 'arraybuffer',
            decompress: false,
            headers: {
                'user-agent': userAgent.toString(),
                'accept': 'text/html,application/xhtml+xml,application/xml',
                'accept-encoding': 'gzip'
            }
        })

        console.log(`user-agent: ${userAgent.toString()}`)
        console.log(`content-type: ${resp.headers['content-type']}`)

        if (resp.status === 200) {
            htmlContent = unzipSync(resp.data)
            writeFileSync(fileName, htmlContent)
        }
    }
    return htmlContent
}

async function fetchDataFromHtml(content: string | Buffer) {
    const $ = load(content)
    // colors

    console.log($.html().substring(10,100))
    console.log($('nav.tabnav').length)
    console.log($('ul.bxslider').length)
}

async function run() {
    const content = await getWebPage()
    await fetchDataFromHtml(content)
}

run()