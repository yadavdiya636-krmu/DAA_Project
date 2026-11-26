# RouteWise — Delivery Network Optimization

An interactive React application for designing a weighted delivery network and optimizing it with **Prim's** and **Kruskal's** minimum spanning tree algorithms. All computation, persistence and visualization run locally in the browser — no backend or external API is required.

## Quick start

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # 43 unit tests
npm run build    # production bundle in dist/
npm run preview  # serve the production build
npm run smoke    # headless Chrome QA (requires Google Chrome installed)
```

## Features

- **Dashboard** — network statistics, cost/connectivity charts, recent activity and an optimized-network preview.
- **Locations & Routes** — full CRUD with validation (positive costs, no self-loops, no duplicate undirected routes), search, filters, sorting, CSV export and printing.
- **Network Graph** — React Flow canvas with draggable, persisted node positions, zoom, fit view, edge labels, node/edge inspection and reset layout.
- **MST Optimizer** — run Prim, Kruskal or both; view original vs optimized graphs, selected edges, savings, independent MST validation, disconnected-component warnings and a replayable trace of real algorithm steps (start, pause, resume, previous, next, reset, speed).
- **Algorithm Comparison** — identical-input comparison of cost, edges, measured time, iterations and connectivity, plus real size-vs-time benchmarks on induced subgraphs.
- **Simulation** — seeded synthetic network generator (mulberry32), real algorithm measurements across generated sizes, and one-click application of a synthetic network to the workspace.
- **Settings** — theme (light/dark/system), default algorithm, animation speed, currency, graph defaults, simulation defaults, sample reset and clear-all with confirmation.
- **Persistence** — versioned LocalStorage keys with corrupt-data sanitization. First load seeds a 9-location / 15-route sample network.

## Project structure

```
src/
  algorithms/   Prim, Kruskal, Union-Find (path compression + rank), MST verification
  components/   layout, common UI, charts, graph canvases, step player
  context/      AppContext (state + persistence) and ToastContext
  data/         sample network and navigation config
  pages/        Dashboard, Locations, Routes, NetworkGraph, MSTOptimizer,
                AlgorithmComparison, Simulation, Settings
  utils/        graph helpers/validation, calculations, storage, generator, export
scripts/smoke.mjs   Puppeteer-based end-to-end QA script
```

## Algorithms

Both implementations are written from scratch and return the selected edges, total cost, iteration count, a real `performance.now()` timing, connectivity status, components and a detailed step trace for visualization.

**Prim's algorithm** starts at a vertex and repeatedly adds the cheapest edge crossing from the visited set to an unvisited vertex. A naive scan is used over the edge list, giving **O(V² + E)** time in this implementation (effectively O(E·V) for the scan) and **O(V + E)** space. It is convenient for dense graphs and incremental expansion from a hub.

**Kruskal's algorithm** sorts all edges by weight and accepts an edge only when it joins two different components, using a disjoint-set structure with **path compression** and **union by rank**. Sorting dominates at **O(E log E)**; Union-Find operations are near-constant amortized, **O(E α(V))**. It is convenient for sparse graphs and naturally sorted edge lists.

A minimum spanning tree connects all V vertices with exactly V−1 edges and the smallest possible total weight. For connected graphs both algorithms must produce the same minimum *cost*, though equal-weight ties may yield different valid edge sets. If the graph is disconnected no spanning tree exists: both algorithms return a **spanning forest**, explicitly report `connected: false` and list the components. Weights must be positive; invalid, duplicate and self-loop edges are rejected before and during algorithm execution. An independent verifier checks edge validity, acyclicity, connectivity, the V−1 count, reported cost and (for small graphs) brute-force optimality.

Iteration counts are defined per algorithm: Prim counts edge selections, Kruskal counts edges examined (including cycle rejections). Benchmarks are averages of repeated real runs; timings on tiny graphs are inherently noisy and are not presented as definitive performance rankings.

## Data and limitations

- Data is stored only in the current browser's LocalStorage; clearing browser data removes it. There is no multi-user sync, authentication or server-side persistence.
- Route costs are treated as the weight to minimize; the MST does not model capacities, delivery windows, directed travel or turn restrictions.
- The synthetic generator is intended for algorithm demonstration, not realistic logistics forecasting.
- The production bundle splits React, charts, React Flow, router and icons into separate chunks.
