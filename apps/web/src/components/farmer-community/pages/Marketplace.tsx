'use client';

import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Input } from '../ui/input';
import { formatCurrency, formatCurrencyCompact } from '../ui/currency-utils';
import {
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Star,
  MapPin,
  Package,
  Users,
  Search,
  Filter,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Tag,
  Truck,
  Clock,
  ChevronRight,
  Wheat,
  Leaf,
  BarChart3,
  CheckCircle,
  Phone,
  MessageSquare,
  ExternalLink
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Alert, AlertDescription } from '../ui/alert';

const marketListings = [
  {
    id: 'ML001',
    product: 'Maize (Corn)',
    variety: 'OBA Super 9',
    seller: 'Agro Farm Ibadan',
    location: 'Ibadan, Oyo State',
    quantity: 50,
    unit: 'bags (100kg)',
    pricePerUnit: 32000,
    totalValue: 1600000,
    quality: 'Premium',
    moisture: 12.5,
    harvestDate: '2024-08-01',
    listingDate: '2024-08-05',
    expiryDate: '2024-09-05',
    deliveryOptions: ['Pickup', 'Delivery'],
    rating: 4.8,
    reviews: 24,
    status: 'active',
    category: 'Grains',
    image: '🌽'
  },
  {
    id: 'ML002',
    product: 'Cassava Tubers',
    variety: 'TMS 30572',
    seller: 'Green Valley Farm',
    location: 'Enugu, Enugu State',
    quantity: 200,
    unit: 'bags (50kg)',
    pricePerUnit: 8500,
    totalValue: 1700000,
    quality: 'Export Grade',
    moisture: 65,
    harvestDate: '2024-07-28',
    listingDate: '2024-08-03',
    expiryDate: '2024-08-20',
    deliveryOptions: ['Pickup'],
    rating: 4.5,
    reviews: 18,
    status: 'active',
    category: 'Tubers',
    image: '🥔'
  },
  {
    id: 'ML003',
    product: 'Tomatoes',
    variety: 'Roma VF',
    seller: 'Plateau Farms',
    location: 'Jos, Plateau State',
    quantity: 80,
    unit: 'crates (20kg)',
    pricePerUnit: 4200,
    totalValue: 336000,
    quality: 'Grade A',
    moisture: 92,
    harvestDate: '2024-08-07',
    listingDate: '2024-08-08',
    expiryDate: '2024-08-18',
    deliveryOptions: ['Delivery'],
    rating: 4.9,
    reviews: 41,
    status: 'active',
    category: 'Vegetables',
    image: '🍅'
  },
  {
    id: 'ML004',
    product: 'Groundnuts',
    variety: 'SAMNUT 24',
    seller: 'Kano Agro Cooperative',
    location: 'Kano, Kano State',
    quantity: 120,
    unit: 'bags (100kg)',
    pricePerUnit: 68000,
    totalValue: 8160000,
    quality: 'Premium',
    moisture: 9.5,
    harvestDate: '2024-07-15',
    listingDate: '2024-07-20',
    expiryDate: '2024-09-20',
    deliveryOptions: ['Pickup', 'Delivery', 'Logistics Partner'],
    rating: 4.7,
    reviews: 35,
    status: 'active',
    category: 'Legumes',
    image: '🥜'
  },
  {
    id: 'ML005',
    product: 'Yam',
    variety: 'Pona',
    seller: 'Benue Farms Ltd',
    location: 'Makurdi, Benue State',
    quantity: 150,
    unit: 'tubers',
    pricePerUnit: 1200,
    totalValue: 180000,
    quality: 'Standard',
    moisture: 70,
    harvestDate: '2024-08-02',
    listingDate: '2024-08-04',
    expiryDate: '2024-09-04',
    deliveryOptions: ['Pickup', 'Delivery'],
    rating: 4.3,
    reviews: 12,
    status: 'active',
    category: 'Tubers',
    image: '🍠'
  },
  {
    id: 'ML006',
    product: 'Palm Oil',
    variety: 'Fresh Crude',
    seller: 'Delta Palms Co.',
    location: 'Warri, Delta State',
    quantity: 30,
    unit: 'drums (200L)',
    pricePerUnit: 195000,
    totalValue: 5850000,
    quality: 'Grade A',
    moisture: 0.2,
    harvestDate: '2024-08-01',
    listingDate: '2024-08-06',
    expiryDate: '2024-10-06',
    deliveryOptions: ['Delivery', 'Logistics Partner'],
    rating: 4.6,
    reviews: 29,
    status: 'active',
    category: 'Cash Crops',
    image: '🫙'
  }
];

const buyerRequests = [
  {
    id: 'BR001',
    buyer: 'FoodPlus Nigeria Ltd',
    product: 'Maize',
    quantity: 500,
    unit: 'bags',
    priceOffered: 31500,
    totalBudget: 15750000,
    quality: 'Premium',
    deliveryDate: '2024-09-01',
    location: 'Lagos',
    contactPerson: 'Adebayo Okonkwo',
    phone: '+234 801 234 5678',
    status: 'open',
    postedDate: '2024-08-07',
    expiryDate: '2024-08-21'
  },
  {
    id: 'BR002',
    buyer: 'Starch Nigeria Plc',
    product: 'Cassava',
    quantity: 1000,
    unit: 'bags',
    priceOffered: 8200,
    totalBudget: 8200000,
    quality: 'Export Grade',
    deliveryDate: '2024-08-25',
    location: 'Sagamu, Ogun',
    contactPerson: 'Ngozi Eze',
    phone: '+234 803 456 7890',
    status: 'open',
    postedDate: '2024-08-05',
    expiryDate: '2024-08-19'
  },
  {
    id: 'BR003',
    buyer: 'Jumia Fresh',
    product: 'Tomatoes',
    quantity: 200,
    unit: 'crates',
    priceOffered: 4000,
    totalBudget: 800000,
    quality: 'Grade A',
    deliveryDate: '2024-08-14',
    location: 'Lagos Island',
    contactPerson: 'Taiwo Adeyemi',
    phone: '+234 807 890 1234',
    status: 'urgent',
    postedDate: '2024-08-08',
    expiryDate: '2024-08-14'
  },
  {
    id: 'BR004',
    buyer: 'Vegetable Oil Mills Ltd',
    product: 'Groundnuts',
    quantity: 200,
    unit: 'bags',
    priceOffered: 66000,
    totalBudget: 13200000,
    quality: 'Premium',
    deliveryDate: '2024-09-15',
    location: 'Kano',
    contactPerson: 'Aminu Garba',
    phone: '+234 805 678 9012',
    status: 'open',
    postedDate: '2024-08-03',
    expiryDate: '2024-08-31'
  }
];

const marketPrices = [
  { crop: 'Maize', unit: '100kg bag', currentPrice: 32000, lastWeek: 30500, lastMonth: 28000, trend: 'up', change: 4.9, category: 'Grains' },
  { crop: 'Cassava', unit: '50kg bag', currentPrice: 8500, lastWeek: 8800, lastMonth: 9200, trend: 'down', change: -3.4, category: 'Tubers' },
  { crop: 'Rice (local)', unit: '50kg bag', currentPrice: 48000, lastWeek: 46500, lastMonth: 43000, trend: 'up', change: 3.2, category: 'Grains' },
  { crop: 'Tomatoes', unit: '20kg crate', currentPrice: 4200, lastWeek: 3800, lastMonth: 3200, trend: 'up', change: 10.5, category: 'Vegetables' },
  { crop: 'Groundnuts', unit: '100kg bag', currentPrice: 68000, lastWeek: 69500, lastMonth: 65000, trend: 'down', change: -2.2, category: 'Legumes' },
  { crop: 'Palm Oil', unit: '25L', currentPrice: 24500, lastWeek: 24000, lastMonth: 22000, trend: 'up', change: 2.1, category: 'Cash Crops' },
  { crop: 'Yam', unit: 'per tuber', currentPrice: 1200, lastWeek: 1100, lastMonth: 950, trend: 'up', change: 9.1, category: 'Tubers' },
  { crop: 'Sorghum', unit: '100kg bag', currentPrice: 24000, lastWeek: 23500, lastMonth: 22000, trend: 'up', change: 2.1, category: 'Grains' },
  { crop: 'Cowpea', unit: '50kg bag', currentPrice: 55000, lastWeek: 54000, lastMonth: 50000, trend: 'up', change: 1.9, category: 'Legumes' },
  { crop: 'Pepper (dried)', unit: '50kg bag', currentPrice: 78000, lastWeek: 80000, lastMonth: 75000, trend: 'down', change: -2.5, category: 'Spices' }
];

const categories = ['All', 'Grains', 'Tubers', 'Vegetables', 'Legumes', 'Cash Crops', 'Spices'];

export function Marketplace() {
  const [activeTab, setActiveTab] = useState('listings');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [listings, setListings] = useState(marketListings);
  const [requests, setRequests] = useState(buyerRequests);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Modals
  const [isListProduceOpen, setIsListProduceOpen] = useState(false);
  const [contactListing, setContactListing] = useState<any | null>(null);
  const [respondRequest, setRespondRequest] = useState<any | null>(null);

  // List Produce Form State
  const [newListingForm, setNewListingForm] = useState({
    product: '',
    variety: '',
    category: 'Grains',
    quantity: '50',
    unit: 'bags (100kg)',
    pricePerUnit: '35000',
    location: 'Ibadan, Oyo State',
    quality: 'Premium',
    image: '🌽'
  });

  // Respond Form State
  const [proposalForm, setProposalForm] = useState({
    offerPrice: '',
    deliveryDate: '',
    notes: 'Available immediately from our Ibadan estate warehouse. Certified moisture levels < 12.5%.'
  });

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleCreateListing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListingForm.product) return;
    const qty = parseFloat(newListingForm.quantity) || 1;
    const price = parseFloat(newListingForm.pricePerUnit) || 1000;
    const newEntry = {
      id: `ML${String(listings.length + 1).padStart(3, '0')}`,
      product: newListingForm.product,
      variety: newListingForm.variety || 'Certified Hybrid',
      seller: 'My CultivaNode Estate',
      location: newListingForm.location,
      quantity: qty,
      unit: newListingForm.unit,
      pricePerUnit: price,
      totalValue: qty * price,
      quality: newListingForm.quality,
      moisture: 12.0,
      harvestDate: new Date().toISOString().split('T')[0],
      listingDate: new Date().toISOString().split('T')[0],
      expiryDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      deliveryOptions: ['Pickup', 'Delivery'],
      rating: 5.0,
      reviews: 1,
      status: 'active',
      category: newListingForm.category,
      image: newListingForm.image
    };
    setListings([newEntry, ...listings]);
    setIsListProduceOpen(false);
    showFeedback(`Your produce listing for "${newListingForm.product}" is now live on CultivaNode Marketplace!`);
  };

  const handleSendProposal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!respondRequest) return;
    showFeedback(`Supply proposal of ${formatCurrency(parseFloat(proposalForm.offerPrice) || respondRequest.priceOffered)} per ${respondRequest.unit} submitted to ${respondRequest.buyer}!`);
    setRespondRequest(null);
  };

  const filteredListings = listings.filter(listing => {
    const matchesSearch = listing.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.seller.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || listing.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredPrices = marketPrices.filter(p =>
    selectedCategory === 'All' || p.category === selectedCategory
  );

  const totalListingValue = listings.reduce((sum, l) => sum + l.totalValue, 0);
  const activeListings = listings.filter(l => l.status === 'active').length;
  const openRequests = requests.filter(r => r.status === 'open' || r.status === 'urgent').length;
  const urgentRequests = requests.filter(r => r.status === 'urgent').length;

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold text-gray-900 font-serif">Marketplace</h1>
          <p className="text-sm text-gray-600">Buy and sell agricultural commodities, view real-time market prices and buyer contracts</p>
        </div>
        <Button 
          className="bg-leaf-800 hover:bg-leaf-900 text-white shadow-sm"
          onClick={() => setIsListProduceOpen(true)}
        >
          <Plus className="h-4 w-4 mr-1" />
          List Produce
        </Button>
      </div>

      {feedback && (
        <Alert className="border-leaf-300 bg-leaf-50 text-leaf-900">
          <CheckCircle className="h-4 w-4 text-leaf-700" />
          <AlertDescription className="text-xs font-medium">
            {feedback}
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4 border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 uppercase tracking-wide font-medium">Active Listings</p>
              <p className="text-2xl font-bold text-gray-900">{activeListings}</p>
              <p className="text-xs text-leaf-700 font-medium">{formatCurrencyCompact(totalListingValue)} total value</p>
            </div>
            <Package className="h-8 w-8 text-leaf-700" />
          </div>
        </Card>

        <Card className="p-4 border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 uppercase tracking-wide font-medium">Buyer Requests</p>
              <p className="text-2xl font-bold text-gray-900">{openRequests}</p>
              {urgentRequests > 0 && (
                <p className="text-xs text-red-600 font-semibold">{urgentRequests} urgent contract</p>
              )}
            </div>
            <Users className="h-8 w-8 text-node-600" />
          </div>
        </Card>

        <Card className="p-4 border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 uppercase tracking-wide font-medium">Best Performer</p>
              <p className="text-base font-bold text-gray-900">Tomatoes</p>
              <p className="text-xs text-leaf-700 font-medium flex items-center">
                <ArrowUpRight className="h-3 w-3 mr-0.5" />
                +10.5% this week
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-leaf-700" />
          </div>
        </Card>

        <Card className="p-4 border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 uppercase tracking-wide font-medium">Price Alerts</p>
              <p className="text-2xl font-bold text-gray-900">3</p>
              <p className="text-xs text-harvest-600 font-medium">prices above target</p>
            </div>
            <Tag className="h-8 w-8 text-harvest-600" />
          </div>
        </Card>
      </div>

      {/* Filter Row */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search produce, sellers, location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-9 text-sm"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-leaf-800 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="listings" className="text-xs">Produce Listings</TabsTrigger>
          <TabsTrigger value="requests" className="text-xs">Buyer Requests</TabsTrigger>
          <TabsTrigger value="prices" className="text-xs">Market Prices</TabsTrigger>
        </TabsList>

        {/* Listings Tab */}
        <TabsContent value="listings" className="space-y-3 mt-4">
          {filteredListings.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-sm">No listings found for your search.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredListings.map((listing) => (
                <Card key={listing.id} className="p-4 hover:shadow-md transition-shadow border-gray-100">
                  <div className="space-y-3">
                    {/* Top row */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">{listing.image}</span>
                        <div>
                          <p className="font-semibold text-sm text-gray-900">{listing.product}</p>
                          <p className="text-xs text-gray-500">{listing.variety}</p>
                        </div>
                      </div>
                      <Badge className={`text-xs ${
                        listing.quality === 'Premium' || listing.quality === 'Export Grade'
                          ? 'bg-leaf-100 text-leaf-800'
                          : listing.quality === 'Grade A'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {listing.quality}
                      </Badge>
                    </div>

                    {/* Price & Quantity */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-lg font-bold text-gray-900">{formatCurrency(listing.pricePerUnit)}</p>
                        <p className="text-xs text-gray-500">per {listing.unit}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-700">{listing.quantity.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">{listing.unit} available</p>
                      </div>
                    </div>

                    {/* Seller info */}
                    <div className="space-y-1">
                      <div className="flex items-center space-x-1 text-xs text-gray-600">
                        <Users className="h-3 w-3" />
                        <span className="font-medium">{listing.seller}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <MapPin className="h-3 w-3" />
                        <span>{listing.location}</span>
                      </div>
                    </div>

                    {/* Rating & Delivery */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        <Star className="h-3 w-3 text-harvest-500 fill-harvest-500" />
                        <span className="text-xs font-medium">{listing.rating}</span>
                        <span className="text-xs text-gray-400">({listing.reviews} reviews)</span>
                      </div>
                      <div className="flex gap-1">
                        {listing.deliveryOptions.map(opt => (
                          <Badge key={opt} className="text-xs bg-leaf-50 text-leaf-800 py-0">
                            {opt === 'Delivery' ? <Truck className="h-2.5 w-2.5" /> : opt[0]}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Expiry */}
                    <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        <span>Expires {new Date(listing.expiryDate).toLocaleDateString()}</span>
                      </div>
                      <Button 
                        size="sm" 
                        className="h-7 text-xs bg-leaf-800 hover:bg-leaf-900 text-white"
                        onClick={() => setContactListing(listing)}
                      >
                        Contact Seller
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Buyer Requests Tab */}
        <TabsContent value="requests" className="space-y-3 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {requests.map((req) => (
              <Card key={req.id} className={`p-4 border-gray-100 ${req.status === 'urgent' ? 'border-red-300 bg-red-50/30' : ''}`}>
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-semibold text-sm text-gray-900">{req.buyer}</p>
                        {req.status === 'urgent' && (
                          <Badge className="bg-red-100 text-red-700 text-xs">Urgent</Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">Looking for: <span className="font-medium text-gray-700">{req.product}</span></p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-bold text-gray-900">{formatCurrency(req.priceOffered)}</p>
                      <p className="text-xs text-gray-500">per {req.unit}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-500">Qty needed:</span>
                      <span className="ml-1 font-medium">{req.quantity.toLocaleString()} {req.unit}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Total budget:</span>
                      <span className="ml-1 font-medium text-leaf-700">{formatCurrencyCompact(req.totalBudget)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Quality:</span>
                      <span className="ml-1 font-medium">{req.quality}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Delivery by:</span>
                      <span className="ml-1 font-medium">{new Date(req.deliveryDate).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <MapPin className="h-3 w-3" />
                    <span>{req.location}</span>
                    <span className="mx-1">·</span>
                    <span>{req.contactPerson}</span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                    <div className="flex items-center space-x-1 text-xs text-gray-400">
                      <Clock className="h-3 w-3" />
                      <span>Expires {new Date(req.expiryDate).toLocaleDateString()}</span>
                    </div>
                    <Button 
                      size="sm" 
                      className="h-7 text-xs bg-leaf-800 hover:bg-leaf-900 text-white"
                      onClick={() => {
                        setRespondRequest(req);
                        setProposalForm({
                          offerPrice: String(req.priceOffered),
                          deliveryDate: req.deliveryDate,
                          notes: 'Direct farm estate supply. Certified moisture and quality grade available.'
                        });
                      }}
                    >
                      Respond
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Market Prices Tab */}
        <TabsContent value="prices" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Price Table */}
            <div className="lg:col-span-2">
              <Card className="p-4 border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Current Market Prices</h3>
                <div className="space-y-1">
                  <div className="grid grid-cols-5 text-xs font-medium text-gray-500 pb-2 border-b border-gray-100">
                    <span className="col-span-2">Commodity</span>
                    <span className="text-right">Current</span>
                    <span className="text-right">Last Week</span>
                    <span className="text-right">Change</span>
                  </div>
                  {filteredPrices.map((item) => (
                    <div key={item.crop} className="grid grid-cols-5 text-xs items-center py-2 border-b border-gray-50 hover:bg-gray-50 rounded px-1">
                      <div className="col-span-2">
                        <p className="font-medium text-gray-900">{item.crop}</p>
                        <p className="text-gray-400">{item.unit}</p>
                      </div>
                      <span className="text-right font-semibold text-gray-900">{formatCurrencyCompact(item.currentPrice)}</span>
                      <span className="text-right text-gray-500">{formatCurrencyCompact(item.lastWeek)}</span>
                      <div className="text-right">
                        <span className={`inline-flex items-center font-medium ${item.trend === 'up' ? 'text-leaf-700' : 'text-red-500'}`}>
                          {item.trend === 'up'
                            ? <ArrowUpRight className="h-3 w-3" />
                            : <ArrowDownRight className="h-3 w-3" />}
                          {Math.abs(item.change)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Price Insights */}
            <div className="space-y-4">
              <Card className="p-4 border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-leaf-700" />
                  <span>Rising Crops</span>
                </h3>
                <div className="space-y-2">
                  {marketPrices.filter(p => p.trend === 'up').slice(0, 4).map(item => (
                    <div key={item.crop} className="flex items-center justify-between text-xs">
                      <span className="font-medium text-gray-800">{item.crop}</span>
                      <span className="text-leaf-700 font-semibold flex items-center">
                        <ArrowUpRight className="h-3 w-3" />
                        +{item.change}%
                      </span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-4 border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                  <TrendingDown className="h-4 w-4 text-red-500" />
                  <span>Falling Crops</span>
                </h3>
                <div className="space-y-2">
                  {marketPrices.filter(p => p.trend === 'down').map(item => (
                    <div key={item.crop} className="flex items-center justify-between text-xs">
                      <span className="font-medium text-gray-800">{item.crop}</span>
                      <span className="text-red-500 font-semibold flex items-center">
                        <ArrowDownRight className="h-3 w-3" />
                        {item.change}%
                      </span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-4 border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Best Selling Opportunities</h3>
                <div className="space-y-2">
                  {[
                    { crop: 'Tomatoes', reason: 'Prices up 10.5% — peak demand season', icon: '🍅' },
                    { crop: 'Yam', reason: 'Prices up 9.1% — festival season approaching', icon: '🍠' },
                    { crop: 'Rice', reason: 'Steady demand from processors', icon: '🌾' }
                  ].map(item => (
                    <div key={item.crop} className="flex items-start space-x-2">
                      <span className="text-base">{item.icon}</span>
                      <div>
                        <p className="text-xs font-semibold text-gray-900">{item.crop}</p>
                        <p className="text-xs text-gray-500">{item.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* List Produce Modal */}
      <Dialog open={isListProduceOpen} onOpenChange={setIsListProduceOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleCreateListing}>
            <DialogHeader>
              <DialogTitle>List Agricultural Produce</DialogTitle>
              <DialogDescription>
                Publish your harvest to verified buyers, millers, and commodity aggregators.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-3 text-xs">
              <div>
                <label className="text-xs font-semibold text-gray-700">Commodity Name</label>
                <Input
                  required
                  placeholder="e.g. Yellow Maize, Soybeans, Seed Yam"
                  value={newListingForm.product}
                  onChange={(e) => setNewListingForm({ ...newListingForm, product: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-gray-700">Variety / Cultivar</label>
                  <Input
                    placeholder="e.g. OBA Super 9"
                    value={newListingForm.variety}
                    onChange={(e) => setNewListingForm({ ...newListingForm, variety: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">Category</label>
                  <select
                    className="flex h-9 w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-900 mt-1"
                    value={newListingForm.category}
                    onChange={(e) => setNewListingForm({ ...newListingForm, category: e.target.value })}
                  >
                    <option value="Grains">Grains</option>
                    <option value="Tubers">Tubers</option>
                    <option value="Vegetables">Vegetables</option>
                    <option value="Legumes">Legumes</option>
                    <option value="Cash Crops">Cash Crops</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-gray-700">Available Quantity</label>
                  <Input
                    type="number"
                    min="1"
                    value={newListingForm.quantity}
                    onChange={(e) => setNewListingForm({ ...newListingForm, quantity: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">Unit of Measure</label>
                  <Input
                    value={newListingForm.unit}
                    onChange={(e) => setNewListingForm({ ...newListingForm, unit: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-gray-700">Price per Unit (₦)</label>
                  <Input
                    type="number"
                    min="100"
                    value={newListingForm.pricePerUnit}
                    onChange={(e) => setNewListingForm({ ...newListingForm, pricePerUnit: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">Quality Standard</label>
                  <select
                    className="flex h-9 w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-900 mt-1"
                    value={newListingForm.quality}
                    onChange={(e) => setNewListingForm({ ...newListingForm, quality: e.target.value })}
                  >
                    <option value="Premium">Premium Grade</option>
                    <option value="Export Grade">Export Grade</option>
                    <option value="Grade A">Grade A</option>
                    <option value="Standard">Standard Commercial</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700">Estate / Warehouse Location</label>
                <Input
                  value={newListingForm.location}
                  onChange={(e) => setNewListingForm({ ...newListingForm, location: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>

            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsListProduceOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-leaf-800 hover:bg-leaf-900 text-white">
                Publish Listing
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Contact Seller Modal */}
      {contactListing && (
        <Dialog open={!!contactListing} onOpenChange={() => setContactListing(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{contactListing.image}</span>
                <div>
                  <DialogTitle>{contactListing.product} ({contactListing.variety})</DialogTitle>
                  <DialogDescription>
                    Listed by <strong className="text-gray-900">{contactListing.seller}</strong>
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 py-3 text-xs">
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Unit Price:</span>
                  <span className="font-bold text-gray-900">{formatCurrency(contactListing.pricePerUnit)} / {contactListing.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Stock Available:</span>
                  <span className="font-semibold text-gray-900">{contactListing.quantity} {contactListing.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Location:</span>
                  <span className="font-medium text-gray-700">{contactListing.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Quality Rating:</span>
                  <span className="font-medium text-harvest-600">★ {contactListing.rating} ({contactListing.reviews} reviews)</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="font-semibold text-gray-800">Connect Directly with Seller</p>
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href="tel:+2348031234567"
                    className="inline-flex items-center justify-center h-9 px-3 rounded-lg border border-gray-200 bg-white font-medium text-gray-800 hover:bg-gray-50 text-xs"
                  >
                    <Phone className="h-3.5 w-3.5 mr-1.5 text-leaf-700" />
                    Call Seller
                  </a>
                  <a
                    href={`https://wa.me/2348031234567?text=${encodeURIComponent(`Hello ${contactListing.seller}, I found your listing for ${contactListing.product} on CultivaNode Marketplace.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center h-9 px-3 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 text-xs"
                  >
                    <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                    WhatsApp
                  </a>
                </div>
              </div>
            </div>

            <DialogFooter className="mt-4">
              <Button size="sm" variant="outline" onClick={() => setContactListing(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Respond to Buyer Request Modal */}
      {respondRequest && (
        <Dialog open={!!respondRequest} onOpenChange={() => setRespondRequest(null)}>
          <DialogContent className="max-w-md">
            <form onSubmit={handleSendProposal}>
              <DialogHeader>
                <DialogTitle>Supply Proposal for {respondRequest.buyer}</DialogTitle>
                <DialogDescription>
                  Contract requirement: <strong className="text-gray-900">{reqSummary(respondRequest)}</strong>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-3 text-xs">
                <div className="bg-leaf-50 p-3 rounded-lg border border-leaf-200">
                  <div className="flex justify-between text-xs">
                    <span className="text-leaf-800">Buyer Target Price:</span>
                    <span className="font-bold text-leaf-900">{formatCurrency(respondRequest.priceOffered)} / {respondRequest.unit}</span>
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span className="text-leaf-800">Total Contract Value:</span>
                    <span className="font-bold text-leaf-900">{formatCurrencyCompact(respondRequest.totalBudget)}</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700">Your Offered Unit Price (₦)</label>
                  <Input
                    type="number"
                    value={proposalForm.offerPrice}
                    onChange={(e) => setProposalForm({ ...proposalForm, offerPrice: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700">Earliest Delivery Date</label>
                  <Input
                    type="date"
                    value={proposalForm.deliveryDate}
                    onChange={(e) => setProposalForm({ ...proposalForm, deliveryDate: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700">Proposal Notes & Certification</label>
                  <Input
                    value={proposalForm.notes}
                    onChange={(e) => setProposalForm({ ...proposalForm, notes: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              <DialogFooter className="mt-4">
                <Button type="button" variant="outline" size="sm" onClick={() => setRespondRequest(null)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-leaf-800 hover:bg-leaf-900 text-white">
                  Submit Proposal
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function reqSummary(req: any) {
  return `${req.quantity.toLocaleString()} ${req.unit} of ${req.product} (${req.quality})`;
}
