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
        //htmlContent = readFileSync(fileName).toString()
        return fileName
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
    return fileName
}

// declare type RGBItem = string
declare type NavData = { [key: string]: { th: string[], rows: string[][] } }
async function fetchDataFromHtml(fileName: string) {
    const content = readFileSync(fileName)
    const dataFilename = fileName.replace(/\.html$/, '.json')
    if (existsSync(dataFilename)) {
        return dataFilename
    }
    const $ = load(content)
    let ret: { [key: string]: NavData } = {}
    // colors

    console.log($.html().substring(10, 100))

    const navs = $('nav.tabnav > ul')
    const sliders = $('ul.bxslider')
    console.log(navs.length, sliders.length)
    if (navs.length !== sliders.length) {
        return dataFilename
    }
    const tmpNavs = $('nav.tabnav')
    const titles: string[] = []
    for (let i = 0; i < tmpNavs.length; i++) {
        const h = tmpNavs.eq(i).prev().text().trim()
        titles.push(h)
    }
    const re=/^R\s*(\d+)\s*G\s*(\d+)\s*B\s*(\d+)$/
    for (let i = 0; i < navs.length; i++) {
        const lis = navs.eq(i).children()
        const subLis = sliders.eq(i).children()
        let ret1: NavData = {}
        for (let j = 0; j < lis.length; j++) {
            const title = lis.eq(j).text().trim()
            const table = subLis.eq(j).children('table')
            const thead = table.children('thead')
            let thData: string[] = []
            thead.children().children('th').map((i, el) => {
                thData.push($(el).text().trim())
            })
            const tbody = table.children('tbody')
            let trsData: string[][] = []
            tbody.children('tr').map((i1, el) => {
                let trData: string[] = []
                $(el).children('td').map((i2, el2) => {
                    let txt = $(el2).text().trim()
                    if (i2 < 2) {
                        const res = txt.match(re)
                        if(res){
                            txt = `rgb(${res[1]},${res[2]},${res[3]})`
                        }
                    }
                    trData.push(txt)
                })
                trsData.push(trData)
            })

            ret1[title] = {
                th: thData,
                rows: trsData
            }
        }
        // ret.push(ret1)
        ret[titles[i]] = ret1
    }
    // persistence
    writeFileSync(dataFilename, JSON.stringify(ret))
    return dataFilename
}

async function run() {
    const fileName = await getWebPage()
    console.log(`file: ${fileName}`)
    const dataFileName = await fetchDataFromHtml(fileName)
    console.log(`data-file: ${dataFileName}`)
}

run()