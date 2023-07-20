import { LitElement, html, css } from 'lit';
import { FileSystemBrokerSingleton } from "@lrnwebcomponents/file-system-broker/file-system-broker.js";
import "@lrnwebcomponents/simple-icon/lib/simple-icons.js";
import "@lrnwebcomponents/hax-iconset/lib/simple-hax-iconset.js";
import "@lrnwebcomponents/simple-icon/lib/simple-icon-button-lite.js";
import "@lrnwebcomponents/haxcms-elements/lib/core/haxcms-site-builder.js";

export class HaxCloud extends LitElement {
  static get tag() {
    return 'hax-cloud';
  }
  static get properties() {
    return {
      step: { type: Number },
      siteRoot: { type: String }
    };
  }

  static get styles() {
    return css`
      :host {
        display: block;
      }
      simple-icon-button-lite {
        height: 200px;
        width: 200px;
        border: 2px solid black;
        border-radius: 0;
        display: inline-flex;
        padding: 0;
        margin: 16px;
        --simple-icon-button-border-radius: 0;
        --simple-icon-width: 100px;
        --simple-icon-height: 100px;
      }
      simple-icon-button-lite::part(button) {
        font-size: 20px;
      }
      simple-icon-button-lite:focus,
      simple-icon-button-lite:hover,
      simple-icon-button-lite:focus-within {
        background-color: #3333FF;
        color:white;
      }
      .step-container {
        display: flex;
        flex-direction: row;
        justify-content: center;
      }
      .step {
        border: 1px solid black;
        padding: 16px;
        font-size: 24px;
        display: inline-block;
        width: 30%;
      }
    `;
  }

  constructor() {
    super();
    this.windowControllers = new AbortController();
    this.step = 1;
    this.siteRoot = '/';
    window.addEventListener('manifest-changed', this.editorLoaded.bind(this),
    { signal: this.windowControllers.signal });
  }

  disconnectedCallback() {
    this.windowControllers.abort();
    if (super.disconnectedCallback) {
      super.disconnectedCallback();
    }
  }

  editorLoaded(e) {
    this.step = 2;
  }

  render() {
    return html`
      <div class="step-container">
        <div class="step">
          <h2>Step 1</h2>
          <simple-icon-button-lite icon="file-download" @click="${this.downloadHAXLatest}">Download HAXcms site</simple-icon-button-lite>
          <details>
            <summary>Steps</summary>
            <ol>
              <li>Download the HAXcms site</li>
              <li>Unzip the folder where you manage sites</li>
              <li>Come back here for step 2</li>
            </ol>
          </details>
        </div>
        <div class="step">
          <h2>Step 2</h2>
          <simple-icon-button-lite ?disabled="${this.step < 1}" icon="folder-open" @click="${this.findLocalHaxCopy}">Enable read/write for the directory</simple-icon-button-lite>
          <details>
            <summary>Steps</summary>
            <ol>
              <li>Click the button</li>
              <li>Select the folder you unzipped in step 1</li>
            </ol>
          </details>
        </div>
        <div class="step">
          <h2>Step 3</h2>
          <simple-icon-button-lite ?disabled="${this.step < 2}" icon="hax:hax2022" @click="${this.loadLocalHax}">It's Go Time</simple-icon-button-lite>
        </div>
      </div>
      <div id="loadarea"></div>
    `;
  }

  async downloadHAXLatest() {
    this.step = 1;
    let a = document.createElement("a");
    a.href = "https://github.com/elmsln/HAXcms/archive/refs/tags/7.0.15.zip";
    a.download = "HAXcms-7.0.15.zip";
    a.click();
  }

  async findLocalHaxCopy() {
    if (this.step > 0) {
      const broker = FileSystemBrokerSingleton;
      const ary = await broker.openDir(true);
      await ary.forEach(async (fileRecord) => {
        if (fileRecord.kind === "file" && fileRecord.name === "site.json") {
          let file = await fileRecord.handle.getFile();
          let manifest = JSON.parse(await file.text());
          this.siteRoot = fileRecord.folder;
          await manifest.items.forEach(async (item, index) => {
            let pathTest = this.siteRoot + '/' + item.location.replace('/index.html', '');
            let fileHandler = ary.filter((f) => f.kind === "file" && f.name === "index.html" && f.folder === pathTest);
            // if we found a match then load include the HTML
            if (fileHandler.length > 0) {
              let pageHTMLContent = await fileHandler[0].handle.getFile();
              manifest.items[index].content = await pageHTMLContent.text();
            }
          });
          console.log(manifest);
          if (manifest && manifest.items.length > 0) {
            document.querySelector('haxcms-site-builder').manifest = manifest;
          }
        }
      });
      setTimeout(() => {
        if (this.step === 1) {
          alert("You must select a valid HAXcms site folder");
        }          
      }, 10);
    }
  }

  async loadLocalHax() {
    document.querySelector('haxcms-site-builder').style.display = '';
    this.remove();    
  }
}

customElements.define(HaxCloud.tag, HaxCloud);