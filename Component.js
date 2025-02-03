/**
 * Returns the full path from the template file to where a function was called;
 * @param {'import.meta'} importMeta - the import.meta of a function. Simply pass `import.meta`
 * @throws {Error} if importMeta is null
 * @return {string} the full path
 */
export const getFullPath = (importMeta) => {
  if (!importMeta) {
    throw new Error('Missing import.meta. Simply pass `import.meta` as the argument');
  }

  const scriptSrc = new URL(importMeta.url).pathname;
  return scriptSrc.startsWith("/") ? scriptSrc.slice(1) : scriptSrc;
};

export default class Component {
  constructor() {
    this.template;
    this.scripts;

    const shouldNotAttachToWindow = [
      'It is not recommended to attach events to the window element.',
      'Add an id, and attach the event to the id instead.'
    ].join(' ');

    /**
     * Warns if any events are attached to the window
     *
     * This is because the Component removes the event just as how javascript
     * removes events after an element has been removed. Thats why removing an element where the script
     * is attached to the window would cause unexpected behaviour if the same listener has been reattached again.
     */
    const warnScriptsAttachedToWindow = () => {
      const discouragedWindowEvents = [
        'window.on',
        'window.addeventlistener'
      ]

      const attachedToWindow = discouragedWindowEvents.some(eventType => {
        return this.scripts.toString().trim().toLowerCase().includes(eventType)
      })

      if (attachedToWindow) {
        console.warn(shouldNotAttachToWindow)
      }
    }

    /**
     * Sets the template for the template
     *
     * @throws {Error} if template is null
     * @throws {Error} if template is not a string
     * @throws {Error} if template is an empty string
     * @throws {Error} if scripts is not a callback function
     */
    const validate = () => {
      if (typeof this.template !== 'string') {
        throw new Error('Template must be a string');
      }

      if (this.template === '') {
        throw new Error('Template is required for a component');
      }

      if (!this.scripts) {
        return;
      }

      warnScriptsAttachedToWindow();

      if (typeof this.scripts !== 'function') {
        throw new Error('Script argument must be a function or a callback function')
      };
    }

    /**
     * Render the template.
     * @param {HTMLAllCollection} element - the element where the template will be rendered.
     * @throws {Error} if element to render to is null
     */
    this.render = () => {
      validate();

      setTimeout(() => {
        if (this.scripts) this.scripts();
      }, 0);

      return this.template
    };
  }

  toString = () => this.render();
}
