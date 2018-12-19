## List of Olympic venues of Tokyo 2020

The list of venues is generated using [Bureau of Olympic and Paralympic Games Tokyo 2020 Preparation](https://www.2020games.metro.tokyo.jp) data.


### Usage

Just grab the file `venues.json` it has a list of objects with the structure

```json
{
  "href_en": "https://www.2020games.metro.tokyo.jp/eng/taikaijyunbi/taikai/kaijyou/kaijyou_20/index.html",
  "href_ja": "https://www.2020games.metro.tokyo.jp/taikaijyunbi/taikai/kaijyou/kaijyou_20/index.html",
  "name_en": "Tokyo Stadium",
  "name_ja": "東京スタジアム",
  "olympic": true,
  "address_en": "376-3, Nishimachi, Chofu, Tokyo",
  "address_ja": "東京都調布市西町376番地3",
  "lat": 35.6642695,
  "lon": 139.5271508,
  "nearby_stations": [
    {
      "group_code": "2400120",
      "distance": 558,
      "time": 7
    },
    {
      "group_code": "2400119",
      "distance": 826,
      "time": 10
    }
  ]
},
```

Each object has the properties `olympic` and `paralympic` set to `true` if they'll hold olympic or paralympic events respectively.

## Related links

More [open data repositories](https://github.com/piuccio?utf8=%E2%9C%93&tab=repositories&q=open-data-jp&type=&language=).
