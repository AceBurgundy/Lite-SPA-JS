## Lite SPA JS: Simpler Single-Page Applications (Built For Fun) [View Website](https://lite-spa-js.vercel.app/)

This is Lite SPA JS, a lightweight JavaScript library designed to make building single-page applications (SPAs) easier and more enjoyable. It focuses on a unified approach, combining HTML and JavaScript within a single `Component` class.

### For Who
- Programmers who want to make small websites using React's Component Based Development while still be able to utilize their common html, css and javascript knowledge. 

**VS Code Tip:**

For a more enjoyable development experience in VS Code, install the extension, "Inline HTML". This allows syntax highlighting for your html templates directly within your JavaScript files, providing a seamless workflow.

### Features

* **Component Class:** Lite SPA JS centers around the `Component` class. This class allows you to define your application's structure and logic within a single unit, promoting code organization and maintainability.
* **State Management:** Manage state effectively with the `state` method within the `Component` class. It provides a clear way to track dynamic data and update the DOM accordingly.
* **Event Handling:** Bind event listeners to elements after rendering using the `scripts` property in the `Component` class. This approach encourages separation of concerns and keeps your components clean.
* **CSS Management:** Utilize the `css` helper function to load CSS files associated with your components. This ensures a clean and organized stylesheet strategy.
* **Navigation:** Implement navigation between components using the `Redirect` class. It provides a clear way to define links that update the URL and render the corresponding component.

### Warning

* **Overriden CSS:** The css function simply loads css files inside the <head> element to group related css and component together. If used improperly, styles with the same selectors will be overriden just as how it would normally be. This doesn't work like css modules.

  - To allow the page to load just a bit faster and reduce FOUC, call it inside a component. This way css() will load along the component. Calling css() outside a component will load it on the initial page load. Meaning, if all of your css() calls are outside all of your components, all of them will be called on the initial page load causing unnecessary delay.
    
### Benefits

* **Simplified SPA Development:** Lite SPA JS removes the need for complex boilerplate code, allowing you to focus on building the core functionalities of your application.
* **Improved Code Organization:** The `Component` class promotes well-structured and maintainable code by combining HTML structure and JavaScript logic in a unified manner.
* **Enhanced Developer Experience:** Lite SPA JS prioritizes a clean and streamlined development experience.

### Getting Started

**1. Installation (Optional):**

While not strictly necessary, you can install Lite SPA JS locally for development purposes. However, you can also directly include the library script in your HTML.

**2. Include a Script:**

Add a script.js file to your html which will house you initial component to be rendered

```javascript
<!DOCTYPE html>
<html>
  <head>
    <meta http-equiv="content-type" content="text/html; charset=utf-8" />
    <title></title>
    <script src="./usage/script.js" type="module"></script>
    <link rel="stylesheet" href="./usage/style.css">
  </head>
  <body>

  </body>
</html>
```

**3. Create Components:**

Define your application's components by extending the `Component` class. Here's an example of a basic component:

```javascript
import { Component } from './path/to/Component.js';

export class MyComponent extends Component {
  constructor() {
    super();

    this.template = /* html */`
      <div>
        <h1>My Component</h1>
      </div>
    `;
  }
}
```

**4. Render the Application:**

Use the `Root` class inside your `script.js` to render your initial component:

```javascript
import { Root } from './path/to/Component.js';
import { MyComponent } from './components/MyComponent.js';

new Root({destination: MyComponent}).render();
```

**5. Navigation:**

Implement navigation between components using the `Redirect` class:

```javascript
import { Redirect } from './path/to/Component.js';

const aboutPageLink = new Redirect({
  destination: About, // Replace with your About component
  id: "about-page",
  path: "/about",
  attributes: {"class": "nav-item button-primary"},
  innerHTML: "About"
});

/// Will render an achor tag when added to this.template of a component.
```

**Modularization**

Reuse Components inside other Components:

```javascript
import { Component } from './Component.js';
import { Header } from './components/Header.js';
import { Footer } from './components/Footer.js';

export class HomePage extends Component {
  constructor() {
    super();

    this.template = /* html */`
      ${new Header()}
      <div class="content">
        <h1>Welcome to the Home Page</h1>
        <p>This is the main content of the home page.</p>
      </div>
      ${new Footer()}
    `;
  }
}
```

**State Management:**

Implement simple state management components by using this.state:

```javascript
import { Component, Redirect, css } from '../../../Component.js';
import { About } from '../about/About.js';

export class Home extends Component {
  constructor() {
    super();

    css(import.meta, [
      "./styles/home.css"
    ]);

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
```

This is a basic overview of Lite SPA JS. The provided examples showcase some fundamental features to get you started. Refer to the source code for a comprehensive understanding and explore the possibilities of building SPAs with this lightweight library.
