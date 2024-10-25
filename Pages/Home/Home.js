import Component, { css } from "../../Component.js"

css(import.meta, [
  "./styles/Home.css"
])

export default class Home extends Component {
  constructor() {
    super();

    const likeButton = "like-button";
    let [counterId, count, setCount] = this.state(0, "like-section__counter");

    this.scripts = () => {
      document.getElementById(likeButton).onclick = () => {
        setCount(++count);
      };
    };

    this.template = /* html */`
      <div class="home">
        <h1 class="title">ShockJS</h1>
        <div class="like-section">
          <div class="like-section__counter" id="${counterId}">${count}</div>
          <button id="${likeButton}" class="button-primary like-section__button">Like</button>
        </div>
      </div>
    `;
  }
}