"use client";

import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon, LatLng } from 'leaflet';
import { Search, Filter, Ship, Anchor, Bell, Settings, Menu, X, MapPin, Clock, Flag, Ruler, Route, TrendingUp, BarChart3, Navigation, Waves } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';

// Tipos de dados
interface Ship {
  id: string;
  name: string;
  mmsi: string;
  imo: string;
  type: 'cargo' | 'tanker' | 'cruise' | 'fishing' | 'container' | 'bulk' | 'passenger';
  position: [number, number];
  heading: number;
  speed: number;
  flag: string;
  dimensions: {
    length: number;
    width: number;
    draft: number;
  };
  destination: string;
  eta: string;
  status: 'underway' | 'anchored' | 'moored' | 'aground';
  route: [number, number][];
  lastUpdate: string;
}

interface Port {
  id: string;
  name: string;
  position: [number, number];
  country: string;
  traffic: number;
}

// Dados simulados de navios
const mockShips: Ship[] = [
  {
    id: '1',
    name: 'ATLANTIC EXPLORER',
    mmsi: '123456789',
    imo: 'IMO9876543',
    type: 'cargo',
    position: [-23.5505, -46.6333],
    heading: 45,
    speed: 12.5,
    flag: 'Brazil',
    dimensions: { length: 180, width: 28, draft: 8.5 },
    destination: 'Port of Rotterdam',
    eta: '2024-01-15 14:30',
    status: 'underway',
    route: [[-23.5505, -46.6333], [-22.9068, -43.1729], [-20.2976, -40.2958]],
    lastUpdate: '2024-01-10 10:30'
  },
  {
    id: '2',
    name: 'PACIFIC STAR',
    mmsi: '987654321',
    imo: 'IMO1234567',
    type: 'tanker',
    position: [-22.9068, -43.1729],
    heading: 180,
    speed: 8.2,
    flag: 'Panama',
    dimensions: { length: 250, width: 44, draft: 12.0 },
    destination: 'Port of Santos',
    eta: '2024-01-12 08:15',
    status: 'underway',
    route: [[-22.9068, -43.1729], [-23.9608, -46.3331]],
    lastUpdate: '2024-01-10 10:25'
  },
  {
    id: '3',
    name: 'OCEAN BREEZE',
    mmsi: '456789123',
    imo: 'IMO7654321',
    type: 'cruise',
    position: [-20.2976, -40.2958],
    heading: 90,
    speed: 15.0,
    flag: 'Italy',
    dimensions: { length: 300, width: 38, draft: 8.0 },
    destination: 'Port of Salvador',
    eta: '2024-01-14 16:00',
    status: 'underway',
    route: [[-20.2976, -40.2958], [-12.9714, -38.5014]],
    lastUpdate: '2024-01-10 10:20'
  },
  {
    id: '4',
    name: 'FISHING VESSEL MARIA',
    mmsi: '789123456',
    imo: 'IMO3456789',
    type: 'fishing',
    position: [-12.9714, -38.5014],
    heading: 270,
    speed: 6.5,
    flag: 'Brazil',
    dimensions: { length: 45, width: 12, draft: 4.0 },
    destination: 'Salvador Harbor',
    eta: '2024-01-11 18:00',
    status: 'anchored',
    route: [[-12.9714, -38.5014]],
    lastUpdate: '2024-01-10 10:15'
  }
];

// Dados simulados de portos
const mockPorts: Port[] = [
  { id: '1', name: 'Port of Santos', position: [-23.9608, -46.3331], country: 'Brazil', traffic: 4200 },
  { id: '2', name: 'Port of Rio de Janeiro', position: [-22.9068, -43.1729], country: 'Brazil', traffic: 2800 },
  { id: '3', name: 'Port of Salvador', position: [-12.9714, -38.5014], country: 'Brazil', traffic: 1900 },
  { id: '4', name: 'Port of Vitória', position: [-20.2976, -40.2958], country: 'Brazil', traffic: 2100 }
];

// Ícones personalizados para diferentes tipos de navios
const createShipIcon = (type: string, heading: number) => {
  const colors = {
    cargo: '#3B82F6',
    tanker: '#EF4444',
    cruise: '#8B5CF6',
    fishing: '#10B981',
    container: '#F59E0B',
    bulk: '#6B7280',
    passenger: '#EC4899'
  };

  return new Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(`
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" transform="rotate(${heading})">
        <path d="M12 2L20 8V16L12 22L4 16V8L12 2Z" fill="${colors[type as keyof typeof colors] || '#3B82F6'}" stroke="white" stroke-width="2"/>
        <circle cx="12" cy="12" r="3" fill="white"/>
      </svg>
    `)}`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  });
};

const portIcon = new Icon({
  iconUrl: `data:image/svg+xml;base64,${btoa(`
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="8" fill="#F59E0B" stroke="white" stroke-width="2"/>
      <path d="M8 12h8M12 8v8" stroke="white" stroke-width="2"/>
    </svg>
  `)}`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -10]
});

// Componente para atualizar o centro do mapa
function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  
  return null;
}

export default function MarineTrackerComponent() {
  const [ships, setShips] = useState<Ship[]>(mockShips);
  const [ports] = useState<Port[]>(mockPorts);
  const [selectedShip, setSelectedShip] = useState<Ship | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [showPorts, setShowPorts] = useState(true);
  const [showRoutes, setShowRoutes] = useState(false);
  const [followedShips, setFollowedShips] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([-15.7801, -47.9292]);
  const [notifications, setNotifications] = useState<string[]>([]);

  // Filtrar navios baseado na busca e filtros
  const filteredShips = ships.filter(ship => {
    const matchesSearch = ship.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ship.mmsi.includes(searchTerm) ||
                         ship.imo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || ship.type === filterType;
    return matchesSearch && matchesType;
  });

  // Simular atualizações em tempo real
  useEffect(() => {
    const interval = setInterval(() => {
      setShips(prevShips => 
        prevShips.map(ship => ({
          ...ship,
          position: [
            ship.position[0] + (Math.random() - 0.5) * 0.01,
            ship.position[1] + (Math.random() - 0.5) * 0.01
          ] as [number, number],
          heading: ship.heading + (Math.random() - 0.5) * 10,
          speed: Math.max(0, ship.speed + (Math.random() - 0.5) * 2),
          lastUpdate: new Date().toLocaleString()
        }))
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Seguir/deixar de seguir navio
  const toggleFollowShip = (shipId: string) => {
    setFollowedShips(prev => 
      prev.includes(shipId) 
        ? prev.filter(id => id !== shipId)
        : [...prev, shipId]
    );
  };

  // Centralizar mapa em um navio
  const centerOnShip = (ship: Ship) => {
    setMapCenter(ship.position);
    setSelectedShip(ship);
  };

  // Obter estatísticas
  const getStatistics = () => {
    const totalShips = ships.length;
    const activeShips = ships.filter(s => s.status === 'underway').length;
    const anchoredShips = ships.filter(s => s.status === 'anchored').length;
    const avgSpeed = ships.reduce((acc, s) => acc + s.speed, 0) / ships.length;
    
    return { totalShips, activeShips, anchoredShips, avgSpeed };
  };

  const stats = getStatistics();

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <div className="flex items-center gap-2">
            <Waves className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">MarineTracker</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar navio, IMO, MMSI..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-32 hidden sm:flex">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="cargo">Carga</SelectItem>
              <SelectItem value="tanker">Petroleiro</SelectItem>
              <SelectItem value="cruise">Cruzeiro</SelectItem>
              <SelectItem value="fishing">Pesca</SelectItem>
              <SelectItem value="container">Container</SelectItem>
            </SelectContent>
          </Select>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Bell className="h-4 w-4" />
                {notifications.length > 0 && (
                  <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 text-xs">
                    {notifications.length}
                  </Badge>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Notificações</DialogTitle>
              </DialogHeader>
              <ScrollArea className="h-64">
                {notifications.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Nenhuma notificação</p>
                ) : (
                  notifications.map((notification, index) => (
                    <div key={index} className="p-3 border-b">
                      {notification}
                    </div>
                  ))
                )}
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:relative z-30 w-80 bg-white shadow-lg transition-transform duration-300 ease-in-out h-full`}>
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Controles</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(false)}
                className="md:hidden"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Busca mobile */}
            <div className="relative sm:hidden mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar navio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtros mobile */}
            <div className="sm:hidden mb-4">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="cargo">Carga</SelectItem>
                  <SelectItem value="tanker">Petroleiro</SelectItem>
                  <SelectItem value="cruise">Cruzeiro</SelectItem>
                  <SelectItem value="fishing">Pesca</SelectItem>
                  <SelectItem value="container">Container</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Configurações de camadas */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="show-ports">Mostrar Portos</Label>
                <Switch
                  id="show-ports"
                  checked={showPorts}
                  onCheckedChange={setShowPorts}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="show-routes">Mostrar Rotas</Label>
                <Switch
                  id="show-routes"
                  checked={showRoutes}
                  onCheckedChange={setShowRoutes}
                />
              </div>
            </div>
          </div>

          <Tabs defaultValue="ships" className="flex-1">
            <TabsList className="grid w-full grid-cols-3 mx-4 mt-4">
              <TabsTrigger value="ships">Navios</TabsTrigger>
              <TabsTrigger value="ports">Portos</TabsTrigger>
              <TabsTrigger value="stats">Stats</TabsTrigger>
            </TabsList>

            <TabsContent value="ships" className="mt-4 px-4">
              <ScrollArea className="h-[calc(100vh-280px)]">
                <div className="space-y-2">
                  {filteredShips.map((ship) => (
                    <Card key={ship.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Ship className="h-4 w-4 text-blue-600" />
                              <h3 className="font-medium text-sm">{ship.name}</h3>
                            </div>
                            <div className="space-y-1 text-xs text-gray-600">
                              <p>MMSI: {ship.mmsi}</p>
                              <p>Velocidade: {ship.speed.toFixed(1)} nós</p>
                              <p>Destino: {ship.destination}</p>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                {ship.type}
                              </Badge>
                              <Badge 
                                variant={ship.status === 'underway' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {ship.status}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex flex-col gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => centerOnShip(ship)}
                            >
                              <MapPin className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleFollowShip(ship.id)}
                              className={followedShips.includes(ship.id) ? 'text-blue-600' : ''}
                            >
                              <Bell className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="ports" className="mt-4 px-4">
              <ScrollArea className="h-[calc(100vh-280px)]">
                <div className="space-y-2">
                  {ports.map((port) => (
                    <Card key={port.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Anchor className="h-4 w-4 text-orange-600" />
                              <h3 className="font-medium text-sm">{port.name}</h3>
                            </div>
                            <p className="text-xs text-gray-600">{port.country}</p>
                            <p className="text-xs text-gray-600">Tráfego: {port.traffic} navios/mês</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setMapCenter(port.position)}
                          >
                            <MapPin className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="stats" className="mt-4 px-4">
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Estatísticas Gerais
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Total de Navios:</span>
                      <span className="font-medium">{stats.totalShips}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Em Movimento:</span>
                      <span className="font-medium text-green-600">{stats.activeShips}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Ancorados:</span>
                      <span className="font-medium text-orange-600">{stats.anchoredShips}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Velocidade Média:</span>
                      <span className="font-medium">{stats.avgSpeed.toFixed(1)} nós</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Portos Mais Movimentados
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {ports
                        .sort((a, b) => b.traffic - a.traffic)
                        .map((port, index) => (
                          <div key={port.id} className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2">
                              <span className="w-4 text-center font-medium">{index + 1}</span>
                              {port.name}
                            </span>
                            <span className="text-gray-600">{port.traffic}</span>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Mapa */}
        <div className="flex-1 relative">
          <MapContainer
            center={mapCenter}
            zoom={6}
            className="h-full w-full"
            zoomControl={false}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            
            <MapController center={mapCenter} />

            {/* Marcadores de navios */}
            {filteredShips.map((ship) => (
              <Marker
                key={ship.id}
                position={ship.position}
                icon={createShipIcon(ship.type, ship.heading)}
                eventHandlers={{
                  click: () => setSelectedShip(ship)
                }}
              >
                <Popup>
                  <div className="p-2 min-w-64">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{ship.name}</h3>
                      <Badge variant="outline">{ship.type}</Badge>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <Flag className="h-3 w-3" />
                        <span>{ship.flag}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Navigation className="h-3 w-3" />
                        <span>{ship.speed.toFixed(1)} nós • {ship.heading}°</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        <span>{ship.destination}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        <span>ETA: {ship.eta}</span>
                      </div>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleFollowShip(ship.id)}
                        className={followedShips.includes(ship.id) ? 'text-blue-600' : ''}
                      >
                        <Bell className="h-3 w-3 mr-1" />
                        {followedShips.includes(ship.id) ? 'Seguindo' : 'Seguir'}
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <Ship className="h-3 w-3 mr-1" />
                            Detalhes
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>{ship.name}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <Label className="text-xs text-gray-500">MMSI</Label>
                                <p className="font-medium">{ship.mmsi}</p>
                              </div>
                              <div>
                                <Label className="text-xs text-gray-500">IMO</Label>
                                <p className="font-medium">{ship.imo}</p>
                              </div>
                              <div>
                                <Label className="text-xs text-gray-500">Bandeira</Label>
                                <p className="font-medium">{ship.flag}</p>
                              </div>
                              <div>
                                <Label className="text-xs text-gray-500">Status</Label>
                                <Badge variant={ship.status === 'underway' ? 'default' : 'secondary'}>
                                  {ship.status}
                                </Badge>
                              </div>
                            </div>
                            
                            <Separator />
                            
                            <div>
                              <Label className="text-xs text-gray-500">Dimensões</Label>
                              <div className="flex items-center gap-4 mt-1 text-sm">
                                <div className="flex items-center gap-1">
                                  <Ruler className="h-3 w-3" />
                                  <span>{ship.dimensions.length}m × {ship.dimensions.width}m</span>
                                </div>
                                <span>Calado: {ship.dimensions.draft}m</span>
                              </div>
                            </div>
                            
                            <div>
                              <Label className="text-xs text-gray-500">Navegação</Label>
                              <div className="space-y-1 mt-1 text-sm">
                                <p>Velocidade: {ship.speed.toFixed(1)} nós</p>
                                <p>Rumo: {ship.heading}°</p>
                                <p>Destino: {ship.destination}</p>
                                <p>ETA: {ship.eta}</p>
                              </div>
                            </div>
                            
                            <div>
                              <Label className="text-xs text-gray-500">Última Atualização</Label>
                              <p className="text-sm mt-1">{ship.lastUpdate}</p>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Marcadores de portos */}
            {showPorts && ports.map((port) => (
              <Marker
                key={port.id}
                position={port.position}
                icon={portIcon}
              >
                <Popup>
                  <div className="p-2">
                    <h3 className="font-semibold">{port.name}</h3>
                    <p className="text-sm text-gray-600">{port.country}</p>
                    <p className="text-sm">Tráfego: {port.traffic} navios/mês</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {/* Controles de zoom customizados */}
          <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
            <Button
              variant="outline"
              size="sm"
              className="bg-white shadow-md"
              onClick={() => {
                const map = document.querySelector('.leaflet-container') as any;
                if (map && map._leaflet_map) {
                  map._leaflet_map.zoomIn();
                }
              }}
            >
              +
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-white shadow-md"
              onClick={() => {
                const map = document.querySelector('.leaflet-container') as any;
                if (map && map._leaflet_map) {
                  map._leaflet_map.zoomOut();
                }
              }}
            >
              -
            </Button>
          </div>

          {/* Indicador de status em tempo real */}
          <div className="absolute bottom-4 left-4 z-[1000]">
            <Card className="bg-white/90 backdrop-blur-sm">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Tempo Real • {filteredShips.length} navios visíveis</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Overlay para mobile quando sidebar está aberta */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}