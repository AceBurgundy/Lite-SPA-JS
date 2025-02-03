import About from "./Pages/About/About.js"
import Home from "./Pages/Home/Home.js"
import Component from "./Component.js"

export default class Router extends Component {
  constructor() {
    super();

    const managerId = 'manager'

    const pages = {
      Home,
      About
    }

    const transition = (manager, page) => {
      manager.innerHTML = new pages[page]();
    };

    this.scripts = () => {
      const navItems = document.querySelectorAll('.nav-item');
      const manager = document.getElementById(managerId);

      [...navItems].forEach(item => {
        item.onclick = () => {
          transition(manager, item.textContent);
        }
      })
    };

    this.template = /* html */`
      <nav id="navigation">
        ${
          Object.keys(pages).map(page => {
            return `<button class='nav-item button-primary'>${page}</button>`;
          }).join('')
        }
      </nav>
      <section id="${managerId}" style="height: 100%;">
        ${new Home()}
      </section>
  `;
  }
}