import { Component, Redirect, css } from '../../../Component.js';
import { About } from '../about/About.js';

css(import.meta, [
  "./styles/home.css"
])

export class Home extends Component {
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
      <nav id="navigation">
        ${
          new Redirect({
            destination: About,
            id: "about-page",
            path: "/about",
            attributes: {"class": "nav-item button-primary"},
            innerHTML: "About"
          })
        }
      </nav>
      <div class="home">
        <h1 class="title">Lite SPA JS</h1>
        <div class="like-section">
          <div class="like-section__counter" id="${counterId}">${count}</div>
          <button id="${likeButton}" class="button-primary like-section__button">Like</button>
        </div>
      </div>
  `;
  }
}
