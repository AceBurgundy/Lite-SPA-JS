import Component from "../../Component.js"

export default class Home extends Component {
  constructor() {
    super();

    const likeCounter = "like-counter";
    const likeButton = "like-button";

    this.scripts = () => {
      const counter = document.getElementById(likeCounter);
      const button = document.getElementById(likeButton);

      button.onclick = () => {
        let count = parseInt(counter.textContent)
        counter.textContent = count + 1;
      }
    }

    this.template = /* html */`
      <div class="home">
        <h1 class="title">ShockJS</h1>
        <div class="like-section">
          <div id="${likeCounter}" class="like-section__counter">0</div>
          <button id="${likeButton}" class="button-primary like-section__button">Like</button>
        </div>
      </div>
    `;
  }
}