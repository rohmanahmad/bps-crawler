'use strict'

const { default: axios } = require("axios")
const cherio = require('cherio')
const { createWriteStream } = require("fs")

const domain = 'https://subangkab.bps.go.id'
const pageUrl = domain + '/publication.html?Publikasi%5BtahunJudul%5D=2020&Publikasi%5BkataKunci%5D=kecamatan+dalam+angka&Publikasi%5BcekJudul%5D=0&yt0=Tampilkan&page=#{PAGE}'

const firstURL = pageUrl.replace('#{PAGE}', 1)
const defaultPath = __dirname + '/downloads'

function downloadFile (url, filename) {
    if (!url) return false
    return new Promise((resolve, reject) => {
        // mulai mendownload
        axios({method: 'get', url, responseType: 'stream'})
            .then(function (response) {
                console.log('downloading...', filename)
                if (response.data && response.data.pipe) {
                    response.data.pipe(createWriteStream(defaultPath + '/' + filename))
                }
                resolve(true)
            })
            .catch(reject)
    })
}

function startProcessing (pageCount = 1) {
    for (let page = 1; page <= pageCount; page++) {
        const url = pageUrl.replace('#{PAGE}', page)
        axios
            .get(url)
            .then(async function (response) {
                console.log(url)
                console.log('Page', page)
                const $ = cherio.load(response.data)
                const list = $('#download-publication')
                const titles = $('.thumbnail-judul-publikasi')
                for (const item in list) {
                    const i = list[item]['attribs']
                    if (i && i.href) {
                        const downloadURL = domain + i.href
                        const filename = cherio.load(titles[item]).text().replace(/ /g, '_') + '.pdf'
                        await downloadFile(downloadURL, filename)
                    }
                }
            })
            .catch(console.error)
    }
}

function getJumlahPages () {
    console.log('getting page count...')
    return new Promise((resolve, reject) => {
        axios
            .get(firstURL)
            .then(function (response) {
                const $ = cherio.load(response.data)
                const pagesCount = $('li.page')
                if (pagesCount.length) return resolve(pagesCount.length)
                resolve(1)
            })
            .catch(console.error)
    })
}

getJumlahPages()
    .then(function (pageCount) {
        startProcessing(pageCount)
    })