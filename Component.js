const routes = {};
const pendingCssLoads = [];
const pendingMounts = [];
let activeComponents = [];
let shouldQueueMounts = false;
let renderVersion = 0;

/**
 * Allows navigation by using browser < and > buttons by keeping track of the "/path": Component
 */
window.onpopstate = event => {
  const path = window.location.pathname;
  const page = routes[path];

  if (page) {
    renderRoute(page, path, { updateHistory: false, state: event.state });
  }
};

const uniqueId = () => Math.random().toString(36).substring(2, 10);

const routeState = path => ({ path });

const waitForStyles = () => {
  const cssLoads = pendingCssLoads.splice(0);

  if (cssLoads.length === 0) {
    return Promise.resolve();
  }

  return Promise.allSettled(cssLoads);
};

document.addEventListener("click", event => {
  const anchor = event.target?.closest?.("[data-lite-spa-route]");

  if (!anchor) {
    return;
  }

  const path = anchor.getAttribute("href");
  const destination = routes[path];

  if (!destination) {
    return;
  }

  event.preventDefault();
  renderRoute(destination, path);
});

const mountQueuedComponents = () => {
  const components = pendingMounts.splice(0);

  components.forEach(component => component.__mount());

  return components;
};

const unmountActiveComponents = () => {
  if (activeComponents.length === 0) {
    return;
  }

  activeComponents.slice().reverse().forEach(component => component.__unmount());
  activeComponents = [];
};

const renderRoute = async (destination, path, { replace = false, updateHistory = true } = {}) => {
  const currentRenderVersion = ++renderVersion;
  routes[path] = destination;

  let template = "";

  try {
    pendingMounts.splice(0);
    shouldQueueMounts = true;
    const component = new destination();
    template = component.toString();
  } finally {
    shouldQueueMounts = false;
  }

  await waitForStyles();

  if (currentRenderVersion !== renderVersion) {
    return;
  }

  if (updateHistory && window.location.pathname !== path) {
    const method = replace ? "replaceState" : "pushState";
    window.history[method](routeState(path), "", path);
  }

  unmountActiveComponents();
  document.body.innerHTML = template;
  activeComponents = mountQueuedComponents();
};

export class Redirect {
  /**
   * Constructs a Redirect component that navigates to the specified path and component.
   * @param {Object} options - The options for constructing the Redirect component.
   * @param {String} options.id - The ID for the component.
   * @param {Component} options.destination - The component to render.
   * @param {string} options.path - The new path to set in the URL.
   * @param {object} options.attributes - Additional attributes for the anchor tag.
   * @param {string} [options.innerHTML=""] - The innerHTML to display for the anchor tag.
   */
  constructor({ id, destination, path, attributes = {}, innerHTML = "" } = {}) {
    const extendsComponent = value => Object.create(value.prototype) instanceof Component;
    const containsNoneStringData = value => value.some(type => type !== 'string');

    /**
     * @param {Function|Object} value
     * @returns {boolean}
     */
    function isFunction(value) {
      const propertyNames = Object.getOwnPropertyNames(value);
      return !propertyNames.includes('prototype') || propertyNames.includes('arguments');
    }

    const attributeValueTypes = Object.values(attributes).map(attribute => typeof attribute);
    const attributeKeyTypes = Object.keys(attributes).map(attribute => typeof attribute);

    if (!id) {
      throw new Error("Element ID cannot be null");
    }

    if (!destination) {
      throw new Error("Element destination cannot be null");
    }

    if ("id" in attributes) {
      throw new Error("Cannot add 'id' as an attribute, as a separate parameter already asked for it");
    }

    if ("href" in attributes) {
      throw new Error("Cannot add 'href' as an attribute, as the destination parameter already asked for it");
    }

    if (typeof id !== 'string') {
      throw new Error("Element ID must be of type string");
    }

    if (typeof path !== 'string') {
      throw new Error("Path must be of type string");
    }

    if (containsNoneStringData(attributeValueTypes)) {
      throw new Error("Attributes can only have non-callable data as values");
    }

    if (containsNoneStringData(attributeKeyTypes)) {
      throw new Error("Attributes can only have non-callable data as keys");
    }

    if (isFunction(destination)) {
      throw new Error("Redirect's destination parameter only accepts class references");
    }

    if (!extendsComponent(destination)) {
      throw new Error("Redirect's destination parameter only accepts class references extended from Component");
    }

    const cleanAttributes = Object.entries(attributes)
      .map(([key, value]) => `${key}="${value}"`)
      .join(' ');

    /**
     * Returns an anchor tag with a click handler to simulate navigation.
     * @returns {string} The anchor tag HTML.
     */
    const render = () => {
      const uniqueAnchorId = `${id}-${uniqueId()}`;
      routes[path] = destination;

      // Return anchor tag with unique ID
      return `<a href="${path}" id="${uniqueAnchorId}" data-lite-spa-route="${path}" ${cleanAttributes}>${innerHTML}</a>`;
    };

    this.toString = () => render();
  }
}

export class Root {
  /**
   * Constructs a Root component for the specified destination and path.
   * @param {Object} options - The options for constructing the Root component.
   * @param {Component} options.destination - The component to render.
   * @param {string} [options.path='/'] - The path to set in the URL.
   */
  constructor({ destination, path = '/' } = {}) {
    const extendsComponent = value => Object.create(value.prototype) instanceof Component;

    /**
     * Checks if a value is a function.
     * @param {Function|Object} value - The value to check.
     * @returns {boolean}
     */
    function isFunction(value) {
      const propertyNames = Object.getOwnPropertyNames(value);
      return !propertyNames.includes('prototype') || propertyNames.includes('arguments');
    }

    if (!destination) {
      throw new Error("Element destination cannot be null");
    }

    if (typeof path !== 'string') {
      throw new Error("Path must be of type string");
    }

    if (isFunction(destination)) {
      throw new Error("Root's destination parameter only accepts class references");
    }

    if (!extendsComponent(destination)) {
      throw new Error("Root's destination parameter only accepts class references extended from Component");
    }

    this.render = () => {
      routes[path] = destination;

      window.history.replaceState(routeState(path), "", path);
      renderRoute(destination, path, { replace: true, updateHistory: false });
    };
  }
}

/**
 * Returns the full path from the template file to where a function was called;
 * @param {'import.meta'} importMeta - the import.meta of a function. Simply pass `import.meta`
 * @throws {Error} if importMeta is null
 * @return {string} the full path
 */
export const getFullPath = (importMeta) => {
  if (!importMeta) {
    throw new Error(
      "Missing import.meta. Simply pass `import.meta` as the argument"
    );
  }

  const scriptSrc = new URL(importMeta.url).pathname;
  return scriptSrc.startsWith("/") ? scriptSrc.slice(1) : scriptSrc;
};

/**
 * Load CSS files based on the provided paths.
 * @param {string[]} cssPaths - List of CSS paths to be loaded.
 **/
export const css = (importMeta, cssPaths) =>
  Promise.all(cssPaths.map(cssPath => {
    let pathToScript = getFullPath(importMeta);
    const scriptFileName = pathToScript.split("/").pop();
    pathToScript = pathToScript.replace(scriptFileName, "");

    cssPath = cssPath.startsWith("/")
      ? pathToScript + cssPath
      : pathToScript + "/" + cssPath.replace(/^\.\/?/, "");

    cssPath = cssPath.replace(/([^:]\/)\/+/g, "$1");

    const cssAlreadyLinked = document.querySelector(`link[href='${cssPath}']`);

    if (cssAlreadyLinked) {
      const isLoaded = cssAlreadyLinked.dataset.loaded === "true" || cssAlreadyLinked.sheet;
      const existingLoad = isLoaded
        ? Promise.resolve(cssPath)
        : new Promise(resolve => {
            cssAlreadyLinked.addEventListener("load", () => resolve(cssPath), { once: true });
            cssAlreadyLinked.addEventListener("error", () => resolve(cssPath), { once: true });
          });

      pendingCssLoads.push(existingLoad);
      return existingLoad;
    }

    const styleLink = document.createElement("link");
    styleLink.rel = "stylesheet";
    styleLink.href = cssPath;

    const cssLoad = new Promise(resolve => {
      styleLink.onload = () => {
        styleLink.dataset.loaded = "true";
        resolve(cssPath);
      };

      styleLink.onerror = () => resolve(cssPath);
    });

    pendingCssLoads.push(cssLoad);
    document.head.appendChild(styleLink);

    return cssLoad;
  }));

/**
 * Inject a CDN script into <head>.
 * Accepts either:
 *   1) A full <script> tag string (preferred, matches CDN copy-paste).
 *   2) A plain URL string (fallback).
 *
 * Example:
 *   cdn('<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js"></script>');
 *
 * @param {string} input - Full <script> tag string OR URL string.
 */
export const cdn = input =>
  new Promise((resolve, reject) => {
    if (!input || typeof input !== "string") {
      reject(
        new Error("cdn() requires a <script> string or URL string.")
      );

      return;
    }

    const appendScript = (src, isModule = false) => {
      const existing = document.querySelector(`script[data-cdn="${src}"]`);

      if (existing) {
        if (existing.dataset.loaded === "true") {
          resolve();
        } else {
          existing.addEventListener("load", () => resolve(), { once: true });
          existing.addEventListener("error", () => reject(
              new Error(`Failed to load ${src}`)
            ), { once: true }
          );
        }

        return;
      }

      const script = document.createElement("script");
      script.src = src;

      if (isModule) script.type = "module";
      script.setAttribute("data-cdn", src);

      script.onload = () => {
        script.dataset.loaded = "true";
        resolve();
      };

      script.onerror = () =>
        reject(
          new Error(`Failed to load ${src}`)
        );

      document.head.appendChild(script);
    };

    if (input.trim().startsWith("<script") === true) {
      const template = document.createElement("template");
      template.innerHTML = input.trim();
      const parsedScript = template.content.firstChild;

      if (!(parsedScript instanceof HTMLScriptElement) === true) {
        reject(
          new Error("cdn() string must be a <script> tag.")
        );
        
        return;
      }

      appendScript(parsedScript.src, parsedScript.type === "module");
      return;
    }

    appendScript(input.trim());
  });

// Using ES2022 features for private fields
export class Component {
  #states = {};
  #stateElements = {};
  #isMounted = false;
  #cleanup = null;

  constructor() {
    this.template = ""; // Public field (set only)
    this.logic = null; // Public field (set only)
    this.beforeMount = null;
    this.mounted = null;
    this.beforeUnmount = null;
    this.unmounted = null;

    /**
     * Helper function to validate the template and scripts.
     */
    const validate = () => {
      if (typeof this.template !== "string") {
        throw new Error("Template must be a string");
      }

      if (!this.template) {
        throw new Error("Template is required for a component");
      }

      if (this.logic && typeof this.logic !== "function") {
        throw new Error("Scripts must be a function");
      }

      [this.beforeMount, this.mounted, this.beforeUnmount, this.unmounted]
        .filter(Boolean)
        .forEach(lifecycle => {
          if (typeof lifecycle !== "function") {
            throw new Error("Lifecycle hooks must be functions");
          }
        });
    };

    /**
     * Function to manage state and return a state value with a setter.
     * @param {any} initialValue - Initial state value.
     * @param {string} elementId - The unique element ID for the element tied to this state.
     * @returns {[any, function]} Current state and a setter function to update the state.
     */
    this.state = (initialValue, elementId) => {
      let uniqueElementId = `${elementId}-${uniqueId()}`;

      // Ensure unique element ID for states
      while (Object.hasOwn(this.#states, uniqueElementId)) {
        uniqueElementId = `${elementId}-${uniqueId()}`;
      }

      let value = initialValue;

      // Setter function to update the value and DOM
      const setValue = newValue => {
        value = newValue;

        /**
         * @type {HTMLElement}
         */
        const element = this.#stateElements[uniqueElementId];

        if (!this.#isMounted || !element) {
          return;
        }

        element.textContent = value;
      };

      // Save the initial value and element uniqueElementId in the private states
      this.#states[uniqueElementId] = value;

      // To be used later to track elements associated with the state
      return [uniqueElementId, value, setValue];
    };

    /**
     * Called after rendering to bind elements to states.
     */
    const bindStateElements = () => {
      Object.keys(this.#states).forEach(uniqueElementId => {
        this.#stateElements[uniqueElementId] = document.getElementById(uniqueElementId);

        if (!this.#stateElements[uniqueElementId]) {
          console.warn(`No element found with unique element id: ${uniqueElementId}`);
        }
      });
    };

    /**
     * Render the template and bind event listeners.
     */
    const render = () => {
      validate();

      if (!shouldQueueMounts) {
        // Preserve direct `${new Component()}` rendering outside Root/Redirect.
        setTimeout(() => this.__mount(), 0);
      }

      return this.template; // Return the rendered template
    };

    this.__mount = () => {
      if (this.#isMounted) {
        return;
      }

      bindStateElements();

      if (this.beforeMount) this.beforeMount();
      if (this.logic) {
        const cleanup = this.logic();

        if (typeof cleanup === "function") {
          this.#cleanup = cleanup;
        }
      }
      if (this.mounted) this.mounted();

      this.#isMounted = true;
    };

    this.__unmount = () => {
      if (!this.#isMounted) {
        return;
      }

      if (this.beforeUnmount) this.beforeUnmount();
      if (this.#cleanup) this.#cleanup();
      if (this.unmounted) this.unmounted();

      this.#stateElements = {};
      this.#cleanup = null;
      this.#isMounted = false;
    };

    this.toString = () => {
      const renderedTemplate = render();

      if (shouldQueueMounts) {
        pendingMounts.push(this);
      }

      return renderedTemplate;
    };
  }
}
