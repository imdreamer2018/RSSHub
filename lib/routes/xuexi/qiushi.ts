import { Route } from '@/types';
import cache from '@/utils/cache';
import ofetch from '@/utils/ofetch';
import { load } from 'cheerio';
import * as url from 'node:url';

const host = 'http://www.qstheory.cn';

export const route: Route = {
    path: '/qiushi',
    categories: ['traditional-media'],
    example: '/xuexi/xjpjh',
    parameters: { },
    features: {
        requireConfig: false,
        requirePuppeteer: false,
        antiCrawler: false,
        supportBT: false,
        supportPodcast: false,
        supportScihub: false,
    },
    radar: [
        {
            source: ['people.com.cn/'],
            target: '/:site?/:category?',
        },
    ],
    name: '习近平求是专栏',
    maintainers: [],
    handler,
    url: 'www.qstheory.cn/',
};

async function handler(ctx) {
    console.log('xuexi/xjpjh');

    let title = '习近平求是专栏';
    const link = `http://www.qstheory.cn/zt2019/qskfzsjwz/index.htm`;
    const response = await ofetch(link);

    const $ = load(response);

    const list = $('div.container')
        .map(function () {
            const containerItems = $(this).find('h2 a');
            return containerItems.map(function () {
                return {
                    title: $(this).text(),
                    link: $(this).attr('href'),
                };
            }).get();
        })
        .get()
        .flat()
        .filter((item) => item.link !== undefined);
    const out = await Promise.all(
        list.map(async (info) => {
            const title = info.title;
            const itemUrl = url.resolve(host, info.link);

            const cacheIn = await cache.get(itemUrl);
            if (cacheIn) {
                return JSON.parse(cacheIn);
            }

            const item_response = await ofetch(itemUrl);
            const $ = load(item_response);
            const description = $('div.container.content.inner').html()?.trim();

            const single = {
                title,
                link: itemUrl,
                description,
            };
            cache.set(itemUrl, JSON.stringify(single));
            return single;
        })
    );

    return {
        title,
        link,
        item: out,
    };
}
