import { Accordion } from 'react-bootstrap';
import AutoComplete from './AutoComplete';

interface Location {
  city: string;
  country: string;
}

export default function LocationAccordion({ city, country }: Location) {
  return (
    <Accordion className="accordion-box">
      <Accordion.Item eventKey="0">
        <Accordion.Header>
          <span className="gr-text-9 mb-2 text-black">
            <i className="fas fa-calendar-alt me-2"></i>Change Location
          </span>
          <span className="gr-text-11 text-primary">
            <i className="fas fa-map-marker-alt me-2"></i>
            <em>
              {city}, {country}
            </em>
          </span>
          <i className="fa fa-angle-down icon-bold-angle"></i>
        </Accordion.Header>
        <Accordion.Body>
          <AutoComplete />
        </Accordion.Body>
      </Accordion.Item>
    </Accordion>
  );
}
