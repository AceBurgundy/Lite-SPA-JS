/** @type {Record<string, typeof Component>} */
const routes = {};

/** @type {Array<Promise<string>>} */
const pendingCssLoads = [];

/** @type {Array<Component>} */
const pendingMounts = [];

/** @type {Array<Component>} */
let activeComponents = [];

/** @type {boolean} */
let shouldQueueMounts = false;

/** @type {number} */
let renderVersion = 0;

/**
 * Allows navigation by using browser < and > buttons by keeping track of the "/path": Component.
 * @param {PopStateEvent} event - The popstate event object.
 * @returns {void}
 */
window.onpopstate = event => {
  /** @type {string} */
  const path = window.location.pathname;

  /** @type {typeof Component|undefined} */
  const page = routes[path];

  if (page) {
    renderRoute(page, path, { updateHistory: false, state: event.state });
  }
};

/**
 * Generates a random alphanumeric unique identifier string.
 * @returns {string} The generated unique identifier.
 */
const uniqueIdentifier = () => Math.random().toString(36).substring(2, 10);

/**
 * Creates a route state object for history management.
 * @param {string} path - The navigation path.
 * @returns {{path: string}} An object representing the route state.
 */
const routeState = path => ({ path });

/**
 * Waits for all pending CSS loads to settle.
 * @returns {Promise<void|Array<PromiseSettledResult<string>>>} A promise that resolves when all pending CSS loads are settled.
 */
const waitForStyles = () => {
  /** @type {Array<Promise<string>>} */
  const cssLoads = pendingCssLoads.splice(0);

  if (cssLoads.length === 0) {
    return Promise.resolve();
  }

  return Promise.allSettled(cssLoads);
};

/**
 * Intercepts click events on anchor tags with [data-lite-spa-route] attribute for client-side routing.
 * @param {MouseEvent} event - The click event object.
 * @returns {void}
 */
document.addEventListener("click", event => {
  /** @type {Element|null} */
  const anchor = event.target?.closest?.("[data-lite-spa-route]");

  if (!anchor) {
    return;
  }

  /** @type {string|null} */
  const path = anchor.getAttribute("href");

  /** @type {typeof Component|undefined} */
  const destination = routes[path];

  if (!destination) {
    return;
  }

  event.preventDefault();
  renderRoute(destination, path);
});

/**
 * Mounts all components currently queued in pendingMounts.
 * @returns {Array<Component>} The list of mounted components.
 */
const mountQueuedComponents = () => {
  /** @type {Array<Component>} */
  const components = pendingMounts.splice(0);

  components.forEach(component => component.__mount());

  return components;
};

/**
 * Unmounts all active components in reverse order.
 * @returns {void}
 */
const unmountActiveComponents = () => {
  if (activeComponents.length === 0) {
    return;
  }

  activeComponents.slice().reverse().forEach(component => component.__unmount());
  activeComponents = [];
};

/**
 * Renders a component for a specific path, updating browser history if requested.
 * @param {typeof Component} destination - The component class to render.
 * @param {string} path - The URL path associated with the component.
 * @param {Object} [options] - Optional settings.
 * @param {boolean} [options.replace=false] - Whether to replace the history state instead of pushing.
 * @param {boolean} [options.updateHistory=true] - Whether to update the browser history.
 * @returns {Promise<void>} A promise that resolves when the route rendering is complete.
 */
const renderRoute = async (destination, path, { replace = false, updateHistory = true } = {}) => {
  /** @type {number} */
  const currentRenderVersion = ++renderVersion;
  routes[path] = destination;

  /** @type {string} */
  let template = "";

  try {
    pendingMounts.splice(0);
    shouldQueueMounts = true;

    /** @type {Component} */
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
    /** @type {string} */
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
    /**
     * Helper function to check if a class extends Component.
     * @type {function(any): boolean}
     */
    const extendsComponent = value => Object.create(value.prototype) instanceof Component;

    /**
     * Helper function to check if any element in the array is not a string.
     * @type {function(Array<string>): boolean}
     */
    const containsNoneStringData = value => value.some(type => type !== 'string');

    /**
     * Checks if a value is a function (excluding constructor classes).
     * @param {any} value - The value to check.
     * @returns {boolean} True if the value is a standard function, false otherwise.
     */
    function isFunction(value) {
      /** @type {Array<string>} */
      const propertyNames = Object.getOwnPropertyNames(value);
      return !propertyNames.includes('prototype') || propertyNames.includes('arguments');
    }

    /** @type {Array<string>} */
    const attributeValueTypes = Object.values(attributes).map(attribute => typeof attribute);

    /** @type {Array<string>} */
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

    /** @type {string} */
    const cleanAttributes = Object.entries(attributes)
      .map(([key, value]) => `${key}="${value}"`)
      .join(' ');

    /**
     * Returns an anchor tag with a click handler to simulate navigation.
     * @returns {string} The anchor tag HTML.
     */
    const render = () => {
      /** @type {string} */
      const uniqueAnchorId = `${id}-${uniqueIdentifier()}`;
      routes[path] = destination;

      // Return anchor tag with unique ID
      return `<a href="${path}" id="${uniqueAnchorId}" data-lite-spa-route="${path}" ${cleanAttributes}>${innerHTML}</a>`;
    };

    /**
     * Converts the Redirect component to its HTML string representation.
     * @type {function(): string}
     */
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
    /**
     * Helper function to check if a class extends Component.
     * @type {function(any): boolean}
     */
    const extendsComponent = value => Object.create(value.prototype) instanceof Component;

    /**
     * Checks if a value is a function (excluding constructor classes).
     * @param {any} value - The value to check.
     * @returns {boolean} True if the value is a standard function, false otherwise.
     */
    function isFunction(value) {
      /** @type {Array<string>} */
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

    /**
     * Renders the Root component and sets the initial path in history.
     * @returns {void}
     */
    this.render = () => {
      routes[path] = destination;

      window.history.replaceState(routeState(path), "", path);
      renderRoute(destination, path, { replace: true, updateHistory: false });
    };
  }
}

/**
 * Returns the full path from the template file to where a function was called.
 * @param {ImportMeta} importMeta - The import.meta object of the calling module.
 * @returns {string} The full path string.
 * @throws {Error} If importMeta is null or undefined.
 */
export const getFullPath = (importMeta) => {
  if (!importMeta) {
    throw new Error(
      "Missing import.meta. Simply pass `import.meta` as the argument"
    );
  }

  /** @type {string} */
  const scriptSource = new URL(importMeta.url).pathname;
  return scriptSource.startsWith("/") ? scriptSource.slice(1) : scriptSource;
};

/**
 * Loads CSS files dynamically based on the provided paths and module metadata.
 * @param {ImportMeta} importMeta - The import.meta object of the calling module.
 * @param {Array<string>} cssPaths - List of CSS paths to be loaded.
 * @returns {Promise<Array<string>>} A promise resolving to the list of loaded CSS paths.
 */
export const css = (importMeta, cssPaths) =>
  Promise.all(cssPaths.map(cssPath => {
    /** @type {string} */
    let pathToScript = getFullPath(importMeta);

    /** @type {string} */
    const scriptFileName = pathToScript.split("/").pop() || "";
    pathToScript = pathToScript.replace(scriptFileName, "");

    cssPath = cssPath.startsWith("/")
      ? pathToScript + cssPath
      : pathToScript + "/" + cssPath.replace(/^\.\/?/, "");

    cssPath = cssPath.replace(/([^:]\/)\/+/g, "$1");

    /** @type {HTMLLinkElement|null} */
    const cssAlreadyLinked = document.querySelector(`link[href='${cssPath}']`);

    if (cssAlreadyLinked) {
      /** @type {boolean} */
      const isLoaded = cssAlreadyLinked.dataset.loaded === "true" || !!cssAlreadyLinked.sheet;

      /** @type {Promise<string>} */
      const existingLoad = isLoaded
        ? Promise.resolve(cssPath)
        : new Promise(resolve => {
            cssAlreadyLinked.addEventListener("load", () => resolve(cssPath), { once: true });
            cssAlreadyLinked.addEventListener("error", () => resolve(cssPath), { once: true });
          });

      pendingCssLoads.push(existingLoad);
      return existingLoad;
    }

    /** @type {HTMLLinkElement} */
    const styleLink = document.createElement("link");
    styleLink.rel = "stylesheet";
    styleLink.href = cssPath;

    /** @type {Promise<string>} */
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
 * @returns {Promise<void>} A promise that resolves when the script is loaded.
 */
export const cdn = input =>
  new Promise((resolve, reject) => {
    if (!input || typeof input !== "string") {
      reject(
        new Error("cdn() requires a <script> string or URL string.")
      );

      return;
    }

    /**
     * Appends a script element to the document head.
     * @param {string} source - The source URL of the script.
     * @param {boolean} [isModule=false] - Whether the script is an ES module.
     * @returns {void}
     */
    const appendScript = (source, isModule = false) => {
      /** @type {HTMLScriptElement|null} */
      const existingScript = document.querySelector(`script[data-cdn="${source}"]`);

      if (existingScript) {
        if (existingScript.dataset.loaded === "true") {
          resolve();
        } else {
          existingScript.addEventListener("load", () => resolve(), { once: true });
          existingScript.addEventListener("error", () => reject(
              new Error(`Failed to load ${source}`)
            ), { once: true }
          );
        }

        return;
      }

      /** @type {HTMLScriptElement} */
      const script = document.createElement("script");
      script.src = source;

      if (isModule) {
        script.type = "module";
      }
      script.setAttribute("data-cdn", source);

      script.onload = () => {
        script.dataset.loaded = "true";
        resolve();
      };

      script.onerror = () =>
        reject(
          new Error(`Failed to load ${source}`)
        );

      document.head.appendChild(script);
    };

    if (input.trim().startsWith("<script") === true) {
      /** @type {HTMLTemplateElement} */
      const template = document.createElement("template");
      template.innerHTML = input.trim();

      /** @type {ChildNode|null} */
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

/**
 * Base Component class for Lite SPA JS applications.
 */
export class Component {
  /** @type {Record<string, any>} */
  #states = {};

  /** @type {Record<string, HTMLElement|null>} */
  #stateElements = {};

  /** @type {boolean} */
  #isMounted = false;

  /** @type {function()|null} */
  #cleanup = null;

  constructor() {
    /** @type {string} */
    this.template = "";

    /** @type {function()|null} */
    this.logic = null;

    /** @type {function()|null} */
    this.beforeMount = null;

    /** @type {function()|null} */
    this.mounted = null;

    /** @type {function()|null} */
    this.beforeUnmount = null;

    /** @type {function()|null} */
    this.unmounted = null;

    /**
     * Helper function to validate the template and lifecycle hooks.
     * @returns {void}
     * @throws {Error} If template or lifecycle hooks are invalid.
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
     * @returns {[string, any, function(any): void]} A tuple containing the unique element ID, current state value, and a setter function.
     */
    this.state = (initialValue, elementId) => {
      /** @type {string} */
      let uniqueElementId = `${elementId}-${uniqueIdentifier()}`;

      // Ensure unique element ID for states
      while (Object.hasOwn(this.#states, uniqueElementId)) {
        uniqueElementId = `${elementId}-${uniqueIdentifier()}`;
      }

      /** @type {any} */
      let value = initialValue;

      /**
       * Updates the state value and modifies the associated DOM element text content.
       * @param {any} newValue - The new state value.
       * @returns {void}
       */
      const setValue = newValue => {
        value = newValue;

        /** @type {HTMLElement|null} */
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
     * Called after rendering to bind DOM elements to states.
     * @returns {void}
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
     * @returns {string} The rendered template string.
     */
    const render = () => {
      validate();

      if (!shouldQueueMounts) {
        // Preserve direct `${new Component()}` rendering outside Root/Redirect.
        setTimeout(() => this.__mount(), 0);
      }

      return this.template;
    };

    /**
     * Mounts the component, executing lifecycle hooks and logic.
     * @returns {void}
     */
    this.__mount = () => {
      if (this.#isMounted) {
        return;
      }

      bindStateElements();

      if (this.beforeMount) {
        this.beforeMount();
      }
      
      if (this.logic) {
        /** @type {any} */
        const cleanup = this.logic();

        if (typeof cleanup === "function") {
          this.#cleanup = cleanup;
        }
      }
      
      if (this.mounted) {
        this.mounted();
      }

      this.#isMounted = true;
    };

    /**
     * Unmounts the component, executing unmount lifecycle hooks and cleaning up.
     * @returns {void}
     */
    this.__unmount = () => {
      if (!this.#isMounted) {
        return;
      }

      if (this.beforeUnmount) {
        this.beforeUnmount();
      }
      
      if (this.#cleanup) {
        this.#cleanup();
      }
      
      if (this.unmounted) {
        this.unmounted();
      }

      this.#stateElements = {};
      this.#cleanup = null;
      this.#isMounted = false;
    };

    /**
     * Converts the component to its string representation (the rendered HTML template).
     * @returns {string} The HTML template string.
     */
    this.toString = () => {
      /** @type {string} */
      const renderedTemplate = render();

      if (shouldQueueMounts) {
        pendingMounts.push(this);
      }

      return renderedTemplate;
    };
  }
}
