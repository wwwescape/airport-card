import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement('airport-card-editor')
export class AirportCardEditor extends LitElement {
  @property({ type: String }) public title: string = 'Airport Arrivals & Departures';
  @property({ type: String }) public airport_codes: string = '';

  static styles = css`
    :host {
      display: block;
      padding: 16px;
      color: var(--primary-text-color);
    }

    input {
      width: 100%;
      padding: 8px;
      margin: 8px 0;
      border-radius: 4px;
      border: 1px solid #ccc;
    }

    h2 {
      margin-top: 0;
    }

    label {
      display: block;
      margin-bottom: 8px;
      font-weight: 600;
    }
  `;

  render() {
    return html`
      <h2>Configure Airport Card</h2>
      <label>
        Title:
        <input
          type="text"
          .value="${this.title}"
          @input="${(e: any) => { this.title = e.target.value; }}"
        />
      </label>
      <label>
        Airport Codes (comma separated):
        <input
          type="text"
          .value="${this.airport_codes}"
          @input="${(e: any) => { this.airport_codes = e.target.value; }}"
        />
      </label>
    `;
  }

  setConfig(config: any) {
    this.title = config.title || this.title;
    this.airport_codes = config.airport_codes || this.airport_codes;
  }

  getConfig() {
    return {
      title: this.title,
      airport_codes: this.airport_codes
    };
  }
}
