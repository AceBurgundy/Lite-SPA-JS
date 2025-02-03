import Component from "../../Component.js"

export default class About extends Component {
  constructor() {
    super();

    this.template = /* html */`
      <div class="about">
        <h1>
          Shock: Redefining Web Development with Unified HTML and JS Components
        </h1>
        <p>
          Meet Shock, an innovative JavaScript library designed to transform the way you build web applications. At its core is the Component class, a powerful entity that harmoniously blends HTML and JavaScript, providing a unified approach to development. Shock simplifies script loading through the loadScripts method, offering precise control and issuing warnings against common pitfalls like attaching events directly to the window element. Seamlessly manage your styles with the loadCSS method, preventing conflicts and promoting an organized stylesheet approach. With Shock, template rendering becomes a breeze, encapsulating both structure and logic in a single class, unleashing a new era of efficient and streamlined web development.
        </p>
      </div>
    `;
  }
}