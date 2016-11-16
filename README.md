# contentfaux
A way to stub requests to Contentful.

## Status

[![npm](https://img.shields.io/npm/v/contentfaux.svg?maxAge=0&style=flat)](https://www.npmjs.com/package/contentfaux)
[![Travis](https://travis-ci.org/remedyhealth/contentfaux.svg?branch=master)](https://travis-ci.org/remedyhealth/contentfaux)
[![Coverage Status](https://coveralls.io/repos/github/remedyhealth/contentfaux/badge.svg?branch=master)](https://coveralls.io/github/remedyhealth/contentfaux?branch=master)
[![Dependency Status](https://david-dm.org/remedyhealth/contentfaux.svg)](https://david-dm.org/remedyhealth/contentfaux)
[![devDependency Status](https://david-dm.org/remedyhealth/contentfaux/dev-status.svg)](https://david-dm.org/remedyhealth/contentfaux?type=dev)
[![npm](https://img.shields.io/npm/l/contentfaux.svg?maxAge=0&style=flat)](https://raw.githubusercontent.com/remedyhealth/contentfaux/master/LICENSE)

## How does it work.

**Contentfaux** will first need to be setup. It loads real data from a space configured and uses that to perform unit testing locally. Requests made to Contentful are intercepted
and Contentfaux feeds the preloaded data instead.

## Quick Start

To install, simply use `npm`

```javascript
npm i -D contentfaux
```

You will also need to add variables to allow the setup data to be loaded before testing. This can be added either in your package.json file, or with environment variables.

#### package.json

If you choose to use the package.json approach, add the following parameters to your **package.json** file.

```javascript
{
  ...
  "config": {
    "contentfaux": {
      "spaceid": "abcd1234",
      "apikey": "aaaabbbbccccdddd1111222233334444",
      "dir": "path/to/directory"
    }
  }
}
```

* **spaceid** - Your Contentful space id.
* **apikey** - The api key provided by Contentful.
* **dir** - The directory to add the mock data. This will be relative to where you call Contentfaux. Defaults too `/approot/contentfaux`.


#### Environment variables

Alternatively, if you choose to use environment variables, the following can be used:

```
CONTENTFAUX_SPACEID=abcd1234
CONTENTFAUX_APIKEY=aaaabbbbccccdddd1111222233334444
CONTENTFAUX_DIR=path/to/directory
```

After it has been installed, add this block to your scripts in **package.json**:

```
{
  "scripts": {
    ...,
    "contentfaux": "contentfaux setup"
  }
}
```

And run it!

```
npm run contentfaux
```

## Stubbing

To stub, before calling any **Contentful**-related tests, include `Contentfaux`.

```javascript
require('contentfaux')
```

or

```javascript
import 'contentfaux'
```

If you choose to do other tests with Contentful, be sure to keep a reference of Contentfaux and unstub.

```javascript
const Contentfaux = require('contentfaux')
...
Contentfaux.unstub()
```

or

```javascript
import Contentfaux from 'contentfaux'
...
Contentfaux.unstub()
```

## License

MIT
