class GoogleSearchPageParser {

  constructor(){}

  getInputValue() {
    try {
      const input = document.querySelector(".gLFyf.gsfi").value;
      return input.toLowerCase()
    } catch (err) {
      return ""
    }
  }

  getAllSearchResult() {
    const searchResults = [...document.querySelectorAll('.g:not(.mnr-c)')]
    const results = searchResults.map($resultElem => {
      return _createObjResult($resultElem)}
    )

    return results

    function _createObjResult ($resultElem) {
      try {
        const $tagTitle = $resultElem.querySelector('h3');
        const titleText = $tagTitle.innerText.toLowerCase();
        const link = $resultElem.querySelector('a').href;

        return {
          $resultElem,
          $tagTitle,
          titleText,
          link,
          exact: false
        };
      } catch (err) {
        console.warn( err );
      }
    }
  }
}

class SearchQueryHandler {

  constructor(string) {
    this.string = string
    this.preparedQueryStryng = ''
  }

  _tokenize(string) {

    const pattern = /\S+/g // Only word
    const tokens = string.match(pattern)

    const resultObj = handleTokens(tokens)
    return resultObj

    function handleTokens(tokens) {

      const all = [...tokens]

      var result = {
        includesMandatory: false,
        all,
        exceptions: [],
        mandatory: [],
        other: []
      }

      const countTokens = tokens.length - 1
      var i = 0

      while (i <= countTokens) {

        switch (tokens[i]) {
          // Mandatory mark
          case ".":
            result.includesMandatory = true
            result.mandatory.push(tokens[i + 1])
            i += 2
            break;
          case "~":
            result.exceptions.push(tokens[i + 1])
            i += 2
            break;

          default:
            result.other.push(tokens[i])
            i += 1
        }

      }

      return result
    }
  }

  getMandatoryKeywords() {
    if (this.string === '') return []

    this._prepareQueryString(this.string)

    const tokens = this._tokenize(this.preparedQueryStryng)
    if (tokens.includesMandatory === true) {
      const shortedKeywords = this.shortenKeywords(tokens.mandatory)
      tokens.mandatory = shortedKeywords
      return tokens.mandatory
    } else {
      const shortedKeywords = this.shortenKeywords(tokens.other)
      tokens.other = shortedKeywords
      return tokens.other
    }
  }

  shortenKeywords(words) {
    const shortedKeywords = words.map(word => {
      if (word.length < 5) {
        return word
      }
      return word.slice(0, word.length - Math.ceil(word.length / 4));
    });
    return shortedKeywords
  }

  _prepareQueryString(string) {
    let newString = string.replace(/site:.+$/g, '') // remove site:somesite.com
      .replace(/-[\S]+/g, '') // remove -word
      .replace(/intext:[\S]+/g, '') // remove intext:word
      .replace(/[ ]{2,}/g, ' ').trim() // remove more than one space
      .replace(/intitle:/g, '. ')
    this.preparedQueryStryng = newString
  }

}

class ResultsHandler {
  constructor(mandatoryKeywords, results) {
    this.mandatoryKeywords = mandatoryKeywords
    this.results = results
  }

  getResultsDetermineCategories() {

    var exactCount = 0
    const exactResultsIndexes = []

    this.results.forEach((result, resultIndex) => {
      if (titleIncludesAllKeywords(result.titleText, this.mandatoryKeywords)) {
        exactCount++
        exactResultsIndexes.push(resultIndex)
        result.exact = true
      }
    })

    return {
      exactCount,
      exactResultsIndexes,
      results: this.results
    }

    function titleIncludesAllKeywords(title, keywords) {
      return keywords.every(word => {
        return title.includes(word)
      })
    }
  }
}

class MutatorDOM {
  constructor() {}

  moveAllExactResultsAfterFirstResult(allResultsObjs_handled) {

    if(allResultsObjs_handled.exactCount === 0) {
      return;
    }

    const $container = this._prepareExactResultsContainer()

    allResultsObjs_handled.exactResultsIndexes.forEach(indexExactResult => {
      const exactResult = allResultsObjs_handled.results[indexExactResult]
      const $resultElem = exactResult.$resultElem
      styliseResult(exactResult, indexExactResult)
      $container.appendChild($resultElem)
    })

    insertExactResultsContainer($container)

    function styliseResult(exactResult, indexExactResult) {
      exactResult.$tagTitle.style.color = "cyan"
      exactResult.$tagTitle.textContent = `[${indexExactResult}] ${exactResult.$tagTitle.textContent}`
    }

    function insertExactResultsContainer($container) {
      const defaultContainer = document.querySelector('#rso');
      defaultContainer.insertBefore($container, defaultContainer.firstElementChild)
    }
  }

  _prepareExactResultsContainer() {
    const $container = document.createElement('div')
    $container.id = "exactResultsContainer"
    return $container
  }
}

(function handlePage() {

  const googleSearchPageParser = new GoogleSearchPageParser()
  const inputValue = googleSearchPageParser.getInputValue()

  const searchQueryHandler = new SearchQueryHandler(inputValue)
  const mandatoryKeywords = searchQueryHandler.getMandatoryKeywords()

  let allResultsObjs = googleSearchPageParser.getAllSearchResult()
  const resultsHandler = new ResultsHandler(mandatoryKeywords, allResultsObjs)

  const allResultsObjs_categorized = resultsHandler.getResultsDetermineCategories()

  const mutatorDOM = new MutatorDOM()
  mutatorDOM.moveAllExactResultsAfterFirstResult(allResultsObjs_categorized)

})()



