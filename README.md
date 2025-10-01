# Lite SPA JS: Simpler Single-Page Applications (Built For Fun)

[View Website](https://lite-spa-js.vercel.app/)

Lite SPA JS is a lightweight JavaScript library designed to make building single-page applications (SPAs) easier and more enjoyable. It focuses on a unified approach, combining HTML and JavaScript within a single `Component` class.

## Table of Contents

- [Lite SPA JS: Simpler Single-Page Applications (Built For Fun)](#lite-spa-js-simpler-single-page-applications-built-for-fun)
  - [Table of Contents](#table-of-contents)
  - [For Who](#for-who)
  - [Features](#features)
  - [Warning](#warning)
  - [Benefits](#benefits)
  - [Getting Started](#getting-started)
    - [1. Installation (Optional)](#1-installation-optional)
    - [2. Include a Script](#2-include-a-script)
    - [3. Create Components](#3-create-components)
    - [4. Render the Application](#4-render-the-application)
    - [5. Navigation](#5-navigation)
  - [Modularization](#modularization)
    - [State Management, Logic, and CDN Usage](#state-management-logic-and-cdn-usage)
  - [Toast Notifications (Singleton Example)](#toast-notifications-singleton-example)
    - [Toast Component Overview](#toast-component-overview)
    - [How It Works](#how-it-works)
    - [1. Adding Toast as a DOM Element](#1-adding-toast-as-a-dom-element)
    - [2. Calling Toast Methods Globally](#2-calling-toast-methods-globally)
    - [3. Combination of the two](#3-combination-of-the-two)

## For Who

* Developers who want to build small websites using React’s **component-based development** style while still relying on familiar **HTML, CSS, and JavaScript**.

💡 **VS Code Tip:**
Install the **Inline HTML** extension for syntax highlighting of embedded HTML templates inside your JavaScript files.

## Features

* **Component Class:** Define structure and logic within a single unit.
* **State Management:** Manage dynamic data and re-render efficiently.
* **Logic Handling:** Use the `logic` property to bind events after rendering.
* **CSS Management:** Load CSS per component with `css()`.
* **CDN Loader:** Easily load external scripts with `cdn()`, which returns a `Promise` when loaded.
* **Navigation:** Seamlessly handle SPA routing with the `Redirect` class.

## Warning

* The `css()` loader is **not CSS modules**. Selectors can override one another.
* For better performance:

  * Call `css()` **inside** components (load on demand).
  * Avoid calling `css()` globally unless styles are required on initial load.

## Benefits

* **Simplified SPA Development** with less boilerplate.
* **Improved Code Organization** via unified components.
* **Enhanced Developer Experience** with a streamlined workflow.

## Getting Started

### 1. Installation (Optional)

You can install Lite SPA JS locally or directly include it in your HTML.

### 2. Include a Script

```html
<!DOCTYPE html>
<html>
  <head>
    <script src="./usage/script.js" type="module"></script>
    <link rel="stylesheet" href="./usage/style.css">
  </head>
  <body></body>
</html>
```

### 3. Create Components

```js
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

### 4. Render the Application

```js
import { Root } from './path/to/Component.js';
import { MyComponent } from './components/MyComponent.js';

new Root({ destination: MyComponent }).render();
```

### 5. Navigation

```js
import { Redirect } from './path/to/Component.js';

const aboutLink = new Redirect({
  destination: About, 
  id: "about-page",
  path: "/about",
  innerHTML: "About"
});
```

## Modularization

You can reuse components by composing them:

```js
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
      </div>
      ${new Footer()}
    `;
  }
}
```

### State Management, Logic, and CDN Usage

Lite SPA JS supports simple state management, DOM event logic, and lazy loading of external scripts. The `cdn()` helper now returns a `Promise` that resolves once the script is fully loaded, allowing you to delay execution until the dependency is ready.

This is especially useful for **performance-heavy components** like 3D models. Instead of blocking the entire page by loading `@google/model-viewer` at startup, you can lazy-load it only when the section comes into view. That way, the rest of the site stays fast and responsive.

Here’s an example `Contact` component that loads a 3D `@` symbol using `model-viewer`. The CDN script is injected only when the contact section scrolls into view, and the 3D model file itself is loaded later for even better performance:

```js
import { cdn, Component, css } from "../../../Component.js";
import { SectionIntro } from "../section-intro/SectionIntro.js";

export class Contact extends Component {
  constructor(navigation, smootherScroll) {
    super();

    css(import.meta, ["contact.css"]);

    this.logic = () => {
      // Smooth navigation to any section
      document.querySelectorAll(".contact-box-bottom-left-section-list__item-link")
        .forEach(link => {
          link.addEventListener("click", element => {
            element.preventDefault();
            const target = element.currentTarget.getAttribute("href");
            smootherScroll.scrollTo(target, { duration: 1.5, ease: "power4.out" });
          });
        });

      // Lazy load the model-viewer script when top of contact section is 800% away from the viewport
      ScrollTrigger.create({
        trigger: "#contact-section",
        start: "top 800%",
        onEnter: () => {
          cdn(`<script type="module" src="https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js"></script>`)
            .then(() => {
              document.getElementById("contact-box-bottom-right")?.insertAdjacentHTML("beforeend", /* html */`
                <model-viewer 
                  id="contact-3d-model"
                  src=""
                  alt="3D @ Symbol"
                  camera-controls
                  disable-zoom
                  camera-orbit="0deg 75deg 4m"
                  field-of-view="30deg">
                </model-viewer>
              `);
            })
        },
        once: true
      });

      // Lazy load the .glb file separately when closer in view
      ScrollTrigger.create({
        trigger: "#contact-section",
        start: "top 300%",
        onEnter: () => {
          document.getElementById("contact-3d-model").src = "app/static/3D/@.glb";
        },
        once: true
      });
    };

    this.template = /* html */`
      <section id="contact-section">
        ${new SectionIntro("Let's talk business!", "Contact Me")}
        <div id="contact-box">
          <div id="contact-box-top-left">
            <p id="contact-message">
              Planning something new? <br>
              Let's
              <span class="hover-swap">
                <span class="swap-inner">
                  <span>make it happen.</span>
                  <span>talk about it!</span>
                </span>
              </span>
            </p>
          </div>
          <div id="contact-box-top-right">
            <p>Works</p>
          </div>
          <div id="contact-box-bottom-left">
            <ul id="contact-box-bottom-left-section-list">${
              navigation.map(
                item => /* html */`
                  <li class="contact-box-bottom-left-section-list__item">
                    <a alt="${item}" class="contact-box-bottom-left-section-list__item-link" href="#${item}-section">${item}</a>
                  </li>`
              ).join("")
            }</ul>
            <p id="contact-box-bottom-left-copyright">
              Sam Adrian P. Sabalo © 2025
            </p>
          </div>
          <div id="contact-box-bottom-right"></div>
        </div>
      </section>
    `;
  }
}
```

✅ **Why this improves performance**:

* The heavy `model-viewer` library isn’t downloaded until the user scrolls near the contact section.
* The `.glb` 3D model file is deferred even further, reducing initial load time.
* Other parts of your site (navigation, content, etc.) stay interactive and snappy without being blocked by the 3D asset.

## Toast Notifications (Singleton Example)

Lite SPA JS supports **singleton-style components**, such as a global **toast notification system**.

### Toast Component Overview

The `Toasts` component manages notifications globally:

```js
import { Component, css } from "../../../Component.js";

class ToastTypes {
    static INFO = "info";
    static SUCCESS = "success";
    static ERROR = "error";
    static WARNING = "warning";

    static values() {
        return [this.INFO, this.SUCCESS, this.ERROR, this.WARNING];
    }
}

/**
 * Toasts Component
 * Singleton class to manage toast notifications.
 * 
 * Usage:
 * import { toast, ToastTypes } from 'path/to/Toasts.js';
 * toast.show("This is an info message.");
 * toast.show("This is a success message.", ToastTypes.SUCCESS, 5000);
 * toast.show("This is an error message.", ToastTypes.ERROR);
 * toast.show("This is a warning message.", ToastTypes.WARNING, 4000);
 */
class Toasts extends Component {
  /**
   * @type {Toasts}
   */
  static #instance;

  /**
   * Returns the singleton instance of Toasts.
   * @returns {Toasts}
   */
  constructor() {
    if (Toasts.#instance) return Toasts.#instance;

    super();

    this.styles = css(import.meta, ["toast.css"]);

    this.logic = () => {};

    this.template = /*html*/ `
      <div class="toasts" id="toasts">
      </div>
    `;

    Toasts.#instance = this;
  }

  /**
   * Show a toast notification.
   * 
   * @param {string} message - The message to display in the toast.
   * @param {ToastTypes} [type=ToastTypes.INFO] - The type of toast (info, success, error, warning).
   * @param {number} [duration=3000] - Duration in milliseconds before the toast disappears.
   * @returns {void}
   */
  show(message, type = ToastTypes.INFO, duration = 3000) {
    const toastsContainer = document.getElementById("toasts");
    if (!toastsContainer) return;

    if (!ToastTypes.values().includes(type)) {
      throw new Error(
        `Invalid toast type: "${type}". Use one of: ${ToastTypes.values().join(", ")}`
      );
    }

    const toast = document.createElement("div");
    toast.className = `toast toast--${type}`;
    toast.textContent = message;

    toastsContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add("toast--visible");
    }, 100);

    setTimeout(() => {
      toast.classList.remove("toast--visible");

      setTimeout(() => {
        toastsContainer.removeChild(toast);
      }, 300); // match CSS transition duration
    }, duration);
  }

  // Optional static getter for easy access
  static get instance() {
    return this.#instance ?? new Toasts();
  }
}

/**
 * A way to show toast notifications from anywhere in the app.
 */
export const toast = Toasts.instance;
export { ToastTypes };
```

### How It Works

* `Toasts` is a **singleton component**:

  * The first instantiation creates the DOM container.
  * Any future calls reuse the same instance.

* The `toast` instance can be:

  1. **Added directly to templates as an element**
  2. **Called from anywhere in the app programmatically**

### 1. Adding Toast as a DOM Element

```js
import { Component } from './Component.js';
import { toast } from './components/common/toasts/Toasts.js';

export class Home extends Component {
  constructor() {
    super();

    this.template = /* html */`
      <div>
        ${toast} <!-- Singleton instance renders automatically -->
        <button id="button">Show Toast</button>
      </div>
    `;
  }
}
```

### 2. Calling Toast Methods Globally

You can call `toast.show()` anywhere, without adding the instance manually:

```js
import { toast } from './components/common/toasts/Toasts.js';

function notifyUserLogin() {
  toast.show("Welcome back!", ToastTypes.SUCCESS);
}
```

### 3. Combination of the two

```js
import { Component } from './Component.js';
import { toast, ToastTypes } from './components/common/toasts/Toasts.js';

export class Home extends Component {
  constructor() {
    super();

    this.scripts = () => {
      document.getElementById("button").onclick = () => {
        toast.show("New toast created!", type=ToastTypes.SUCCESS);
      };
    };

    this.template = /* html */`
      <div>
        ${toast} <!-- Singleton instance renders automatically -->
        <button id="button">Show Toast</button>
      </div>
    `;
  }
}
```

✅ **Advantages of Singleton Usage**

* Only **one toast container** is ever created.
* Can be **referenced globally** without manually passing around instances.
* Easy integration into **both DOM templates and JavaScript logic**.
