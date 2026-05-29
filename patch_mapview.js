const fs = require('fs');
const file = 'src/components/MapView.tsx';
let content = fs.readFileSync(file, 'utf8');

const createSafeDOMNode = `
              const createSafeDOMNode = (title, lines) => {
                const container = document.createElement('div');
                
                const titleEl = document.createElement('strong');
                titleEl.textContent = title;
                container.appendChild(titleEl);
                
                for (const line of lines) {
                  container.appendChild(document.createElement('br'));
                  if (line.type === 'small') {
                    const el = document.createElement('small');
                    el.textContent = line.text;
                    container.appendChild(el);
                  } else if (line.type === 'em') {
                    const el = document.createElement('em');
                    el.textContent = line.text;
                    container.appendChild(el);
                  } else if (line.text) {
                    container.appendChild(document.createTextNode(line.text));
                  }
                }
                return container;
              };
`;

content = content.replace(
  `              const showPoiPopup = (e: any) => {`,
  `${createSafeDOMNode}\n              const showPoiPopup = (e: any) => {`
);

content = content.replace(
  `                const html = \`<strong>\${props.name}</strong><br />Category: \${category}<br />\${props.description}<br /><small>\${props.status}</small>\`;
                new maplibre.Popup()
                  .setLngLat(coords)
                  .setHTML(html)
                  .addTo(map);`,
  `                const domNode = createSafeDOMNode(props.name, [
                  { text: \`Category: \${category}\` },
                  { text: props.description },
                  { type: 'small', text: props.status }
                ]);
                new maplibre.Popup()
                  .setLngLat(coords)
                  .setDOMContent(domNode)
                  .addTo(map);`
);

content = content.replace(
  `                const html = \`<strong>\${props.name}</strong><br />Category: \${props.category}<br />Distance: \${distanceKm} km<br />Duration: \${durationMin} min<br />\${props.description}<br /><small>\${props.status}</small>\`;
                new maplibre.Popup()
                  .setLngLat(e.lngLat)
                  .setHTML(html)
                  .addTo(map);`,
  `                const domNode = createSafeDOMNode(props.name, [
                  { text: \`Category: \${props.category}\` },
                  { text: \`Distance: \${distanceKm} km\` },
                  { text: \`Duration: \${durationMin} min\` },
                  { text: props.description },
                  { type: 'small', text: props.status }
                ]);
                new maplibre.Popup()
                  .setLngLat(e.lngLat)
                  .setDOMContent(domNode)
                  .addTo(map);`
);

content = content.replace(
  `                const html = \`<strong>\${props.name}</strong><br />Access: \${props.access}<br />\${props.description}<br /><em>\${props.visitor_note}</em><br /><small>\${props.status}</small>\`;
                new maplibre.Popup()
                  .setLngLat(coords)
                  .setHTML(html)
                  .addTo(map);`,
  `                const domNode = createSafeDOMNode(props.name, [
                  { text: \`Access: \${props.access}\` },
                  { text: props.description },
                  { type: 'em', text: props.visitor_note },
                  { type: 'small', text: props.status }
                ]);
                new maplibre.Popup()
                  .setLngLat(coords)
                  .setDOMContent(domNode)
                  .addTo(map);`
);

content = content.replace(
  `                const html = \`<strong>\${props.name}</strong><br />Access: \${props.access}<br />\${props.description}<br /><em>\${props.visitor_note}</em><br /><small>\${props.status}</small>\`;
                new maplibre.Popup()
                  .setLngLat(coords)
                  .setHTML(html)
                  .addTo(map);`,
  `                const domNode = createSafeDOMNode(props.name, [
                  { text: \`Access: \${props.access}\` },
                  { text: props.description },
                  { type: 'em', text: props.visitor_note },
                  { type: 'small', text: props.status }
                ]);
                new maplibre.Popup()
                  .setLngLat(coords)
                  .setDOMContent(domNode)
                  .addTo(map);`
);

fs.writeFileSync(file, content);
