const GAME_STATE = {
  FirstCardAwaits: 'FirstCardAwaits',
  SecondCardAwaits: 'SecondCardAwaits',
  CardMatchFailed: 'CardMatchFailed',
  CardMatched: 'CardMatched',
  GameFinished: 'GameFinished',
}

const Symbols = [
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17989/__.png', // 黑桃
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17992/heart.png', // 愛心
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17991/diamonds.png', // 方塊
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17988/__.png' // 梅花
]

// MVC的View
const view = {
  // 初始卡背的div元素，在class中放入back，並加入屬性data-index日後取用
  getCardElement(index) {
    return `<div data-index="${index}" class="card back"></div>`
  },
  // 取得卡片翻到正面後要呈現的內容
  getCardContent(index) {
    const number = this.transformNumber((index % 13) + 1)
    const symbol = Symbols[Math.floor(index / 13)]
    return `
      <p>${number}</p>
      <img src="${symbol}" />
      <p>${number}</p>
    `
  },
  // 將數字轉換成A, J, Q, K的條件，其餘維持原本數字
  transformNumber(number) {
    switch (number) {
      case 1:
        return 'A'
      case 11:
        return 'J'
      case 12:
        return 'Q'
      case 13:
        return 'K'
      default:
        return number
    }
  },
  // 初始卡片的分布
  displayCards(indexes) {
    const rootElement = document.querySelector('#cards')
    rootElement.innerHTML = indexes.map(index => this.getCardElement(index)).join('')
  },
  // 翻牌的函式，需處理正面和背面的狀況
  flipCards(...cards) {
    // 點擊牌時，若牌是背面，則remove back(變成正面)，並透過card.dataset.index取得卡片內容
    cards.map(card => {
      if (card.classList.contains('back')) {
        // 回傳正面
        card.classList.remove('back')
        card.innerHTML = this.getCardContent(Number(card.dataset.index))
        return
      }
      // 若是正面，則在屬性中加入back，並清除innerHTML
      // 回傳背面
      card.classList.add('back')
      card.innerHTML = null
    })
  },
  pairCards(...cards){
    cards.map(card => {
      card.classList.add('paired')
    })
  },
  renderScore(score){
    document.querySelector(".score").textContent = `Score: ${score}`
  },
  renderTiredTimes(times){
    document.querySelector(".tried").textContent = `You've tried: ${times} times` 
  },
  appendWrongAnimation(...cards){
    cards.map(card => {
      card.classList.add('wrong')
      card.addEventListener('animationend', event => event.target.classList.remove('wrong'), { once: true })
    })
  },
  showGameFinished(){
    const div = document.createElement('div')
    div.classList.add('completed')
    div.innerHTML = `
      <p>Completed!</p>
      <p>Score: ${model.score}</p>
      <p>You've tried: ${model.tiredTimes} times</p>
    `
    const header = document.querySelector('#header')
    header.before(div)
  }
}

// MVC當中的controller
const controller = {
  currentState: GAME_STATE.FirstCardAwaits,
  generateCards(){
    view.displayCards(utility.getRandomNumberArray(52))
  },
  dispatchCardAction(card) {
    if (!card.classList.contains('back')){
      return
    }
    switch (this.currentState){
      case GAME_STATE.FirstCardAwaits:
        view.flipCards(card)
        model.revealedCards.push(card)
        this.currentState = GAME_STATE.SecondCardAwaits
        break
      case GAME_STATE.SecondCardAwaits:
        // 只要切換到SecondCardAwait，嘗試次數就要+1
        view.renderTiredTimes(++model.tiredTimes)
        view.flipCards(card)
        model.revealedCards.push(card)
        // 判斷是否配對成功
        if (model.isRevealedCardsMatched()){
          // 配對成功
          // 翻了兩張牌後，如果配對成功，分數就要+10
          view.renderScore(model.score += 10)
          this.currentState = GAME_STATE.CardMatched
          view.pairCards(...model.revealedCards)
          model.revealedCards = []
          if (model.score === 260){
            console.log('showGameFinished')
            this.currentState = GAME_STATE.GameFinished
            view.showGameFinished()
            return
          }
          this.currentState = GAME_STATE.FirstCardAwaits
        } else {
          // 配對失敗
          this.currentState = GAME_STATE.CardMatchFailed
          view.appendWrongAnimation(...model.revealedCards)
          setTimeout(this.resetCards, 1000)
        }
        break
    }
    console.log('this.currentState', this.currentState)
    console.log('revealedCards', model.revealedCards.map(card => card.dataset.index))
  },
  resetCards(){
    view.flipCards(...model.revealedCards)
    model.revealedCards = []
    // 為什麼這裡要使用controller不能用this，是因為resetCards給setTimeout呼叫時，如果使用this則對象會變成setTimeout，而setTimeout不是controller裡面定義的函式，故要使用controller而不是this
    controller.currentState = GAME_STATE.FirstCardAwaits
  }
}

// MVC當中model
const model = {
  revealedCards: [],
  isRevealedCardsMatched() {
    return this.revealedCards[0].dataset.index % 13 === this.revealedCards[1].dataset.index % 13
  },
  score: 0,
  tiredTimes: 0
}


// 在MVC以外的工具
const utility = {
  // 取得隨機數字的一個陣列，傳入的數字為陣列的長度
  getRandomNumberArray(count) {
    // 取得0~count的一個陣列
    const number = Array.from(Array(count).keys())
    // 將陣列中每個元素的順序打亂洗牌，從number.length-1(最後一個元素)開始，每個元素和隨機一個元素互換位置
    for (let index = number.length - 1; index > 0; index--) {
      let randomIndex = Math.floor(Math.random() * (index + 1))
        ;[number[index], number[randomIndex]] = [number[randomIndex], number[index]]
    }
    // 回傳打散過後的陣列
    return number
  }
}

// 在最外圍執行的程式碼

// 將全部的卡片放入資料(已打散)並顯示卡背的畫面
controller.generateCards()
// 在每一張卡片透過forEach放入監聽器，並監聽click行為，若點擊卡片則執行view.flipCard這個行為(帶入該card元素)
document.querySelectorAll('.card').forEach(card => {
  card.addEventListener('click', event => {
    controller.dispatchCardAction(card)
  })
})