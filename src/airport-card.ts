import { LitElement, html, css, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js";
// import airports from "./airports.json";

interface Flight {
  airline: {
    icaoCode: string;
    name: string;
  };
  flight: {
    iataNumber: string;
  };
  arrival: {
    iataCode: string;
    icaoCode: string;
    scheduledTime: string;
  };
  departure: {
    iataCode: string;
    icaoCode: string;
    scheduledTime: string;
  };
  codeshared?: {
    airline: {
      icaoCode: string;
      name: string;
    };
    flight: {
      iataNumber: string;
    };
  };
  status?: string;
}

interface AirportData {
  code: string;
  arrivals: { flights: Flight[] };
  departures: { flights: Flight[] };
  error?: string;
}

@customElement("airport-card")
export class AirportCard extends LitElement {
  @property({ attribute: false }) public hass: any;
  @property({ type: Object }) private config: any = {
    title: "Airport Arrivals & Departures",
    airport_codes: "",
  };

  static styles = css`
    ha-card {
      padding: 16px;
      background-color: #1b2431;
      color: #ffffff;
      font-family: "Segoe UI", sans-serif;
      border-radius: 12px;
      box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
    }

    h2 {
      margin: 0 0 10px;
      font-size: 1.6rem;
      font-weight: bold;
      color: #ffcb00;
    }

    .airport-info {
      font-size: 1rem;
      color: #ddd;
      margin: 8px 0;
      padding: 5px 0;
    }

    .airport-list {
      display: flex;
      flex-direction: column;
      gap: 20px;
      margin-top: 16px;
    }

    .airport-item {
      background-color: #223044;
      padding: 16px;
      border-radius: 10px;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
    }

    .airport-name {
      font-size: 1.3rem;
      font-weight: 600;
      color: #f5a623;
      margin-bottom: 10px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }

    th,
    td {
      padding: 8px;
      text-align: left;
      border-bottom: 1px solid #34495e;
      font-size: 0.9rem;
    }

    th {
      background-color: #2c3e50;
      color: #f5f5f5;
      font-weight: bold;
    }

    td img {
      width: 30px;
      height: 30px;
      object-fit: contain;
      display: block;
    }

    .error-message {
      color: red;
      font-size: 1rem;
      margin-top: 10px;
    }
  `;

  setConfig(config: any): void {
    this.config = config;
  }

  static getConfigElement() {
    return document.createElement("airport-card-editor");
  }

  private getFlightData(airportCode: string): {
    arrivals: any;
    departures: any;
    error?: string;
  } {
    try {
      const arrivals = this._getSensorData(
        `sensor.airport_arrivals_${airportCode.toLowerCase()}`
      );
      const departures = this._getSensorData(
        `sensor.airport_departures_${airportCode.toLowerCase()}`
      );
      return { arrivals, departures };
    } catch (error: any) {
      return {
        arrivals: [],
        departures: [],
        error: `Failed to fetch flight data for ${airportCode}: ${error.message}`,
      };
    }
  }

  private _getSensorData(sensorId: string) {
    if (!this.hass || !this.config) return html``;
    const sensor = this.hass.states[sensorId];
    if (!sensor) {
      throw new Error(`Sensor with ID ${sensorId} not found.`);
    }
    if (!sensor.state) {
      throw new Error(`Sensor state is missing for ${sensorId}.`);
    }
    return {
      data: sensor.state,
      flights: sensor.attributes.flights as Flight[],
    };
  }

  private formatDateTime(dateTime: string): string {
    const date = new Date(dateTime);
    return date.toLocaleString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  protected render(): TemplateResult {
    if (!this.hass || !this.config) return html``;
    if (!this.config.airport_codes)
      return html`<div class="error-message">
        Please enter valid airport codes.
      </div>`;

    const airportList: string[] = this.config.airport_codes
      .split(",")
      .map((code: string) => code.trim());

    const airportData: AirportData[] = airportList.map((code: string) => {
      const { arrivals, departures, error } = this.getFlightData(code);
      return { code, arrivals, departures, error };
    });

    const validData: AirportData[] = airportData.filter(
      (data: AirportData) => !data.error
    );

    const errorMessages: AirportData[] = airportData.filter(
      (data: AirportData) => data.error
    );

    return html`
      <ha-card>
        <h2>${this.config.title}</h2>

        ${errorMessages.length
          ? html`
              <div class="error-message">
                ${errorMessages.map(
                  (error: AirportData) => html`<p>${error.error}</p>`
                )}
              </div>
            `
          : html``}

        <div class="airport-list">
          ${validData.map(
            (data: AirportData) => html`
              <div class="airport-item">
                <div class="airport-name">${data.code} Arrivals</div>

                <!-- Arrivals Table -->
                <table>
                  <thead>
                    <tr>
                      <th>Date/Time</th>
                      <th></th>
                      <th>Airline</th>
                      <th>Flight No</th>
                      <th>Origin</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${data.arrivals?.flights
                      ?.filter((flight: Flight) => !flight.codeshared) // Filter out codeshared flights
                      ?.filter((flight: Flight) => {
                        const flightTime = new Date(
                          flight.arrival.scheduledTime
                        );
                        return (
                          flightTime > new Date(Date.now() - 60 * 60 * 1000)
                        );
                      })
                      .sort(
                        (a: Flight, b: Flight) =>
                          new Date(a.arrival.scheduledTime).getTime() -
                          new Date(b.arrival.scheduledTime).getTime()
                      )
                      .slice(0, 10)
                      .map(
                        (flight: Flight) => html`
                          <tr>
                            <td>
                              ${this.formatDateTime(
                                flight.arrival.scheduledTime
                              )}
                            </td>
                            <td>
                              <img
                                src="https://content.airhex.com/content/logos/airlines_${this.getAirlineICAOCode(
                                  flight
                                )}_90_90_f.png?proportions=keep"
                                alt="${flight.flight.iataNumber} logo"
                              />
                            </td>
                            <td>
                              ${this.capitalizeWords(
                                this.getAirlineName(flight)
                              )}
                            </td>
                            <td>
                              ${this.capitalize(this.getFlightNumber(flight))}
                            </td>
                            <td>
                              ${this.findAirportByIata(
                                flight.departure.iataCode
                              ).name}
                            </td>
                            <td>
                              ${flight.status
                                ? this.capitalizeWords(flight.status)
                                : "Unknown"}
                            </td>
                          </tr>
                        `
                      )}
                  </tbody>
                </table>

                <div class="airport-name">${data.code} Departures</div>

                <!-- Departures Table -->
                <table>
                  <thead>
                    <tr>
                      <th>Date/Time</th>
                      <th></th>
                      <th>Airline</th>
                      <th>Flight No</th>
                      <th>Destination</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${data.departures?.flights
                      ?.filter((flight: Flight) => !flight.codeshared) // Filter out codeshared flights
                      ?.filter((flight: Flight) => {
                        const flightTime = new Date(
                          flight.departure.scheduledTime
                        );
                        return flightTime > new Date();
                      })
                      .sort(
                        (a: Flight, b: Flight) =>
                          new Date(a.departure.scheduledTime).getTime() -
                          new Date(b.departure.scheduledTime).getTime()
                      )
                      .slice(0, 10)
                      .map(
                        (flight: Flight) => html`
                          <tr>
                            <td>
                              ${this.formatDateTime(
                                flight.departure.scheduledTime
                              )}
                            </td>
                            <td>
                              <img
                                src="https://content.airhex.com/content/logos/airlines_${this.getAirlineICAOCode(
                                  flight
                                )}_90_90_f.png?proportions=keep"
                                alt="${flight.flight.iataNumber} logo"
                              />
                            </td>
                            <td>
                              ${this.capitalizeWords(
                                this.getAirlineName(flight)
                              )}
                            </td>
                            <td>
                              ${this.capitalize(this.getFlightNumber(flight))}
                            </td>
                            <td>
                              ${this.findAirportByIata(flight.arrival.iataCode)
                                .name}
                            </td>
                            <td>
                              ${flight.status
                                ? this.capitalizeWords(flight.status)
                                : "Unknown"}
                            </td>
                          </tr>
                        `
                      )}
                  </tbody>
                </table>
              </div>
            `
          )}
        </div>
      </ha-card>
    `;
  }

  private getAirlineICAOCode(flight: Flight): string {
    if (flight.codeshared?.airline) {
      return flight.codeshared.airline.icaoCode;
    }
    return flight.airline.icaoCode;
  }

  private getAirlineName(flight: Flight): string {
    if (flight.codeshared?.airline) {
      return flight.codeshared.airline.name;
    }
    return flight.airline.name;
  }

  private getFlightNumber(flight: Flight): string {
    if (flight.codeshared?.flight) {
      return flight.codeshared.flight.iataNumber;
    }
    return flight.flight.iataNumber;
  }

  private findAirportByIata(iataCode: string): any {
    // return (
    //   Object.values(airports).find((airport) => airport.iata === iataCode) || {
    //     name: "Unknown Airport",
    //   }
    // );
    return {
      name: iataCode,
    };
  }

  private capitalize(str: string): string {
    if (!str) return "";
    return str.toUpperCase();
  }

  private capitalizeWords(str: string): string {
    if (!str) return "";
    return str
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }

  public getCardSize(): number {
    return 3;
  }
}

(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
  type: "airport-card",
  name: "Airport Card",
  preview: false,
  description:
    "A Home Assistant card showing flight arrivals and departures of specified airports.",
});
