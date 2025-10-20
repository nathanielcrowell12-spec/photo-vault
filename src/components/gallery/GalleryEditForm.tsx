'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, User, MapPin, Users } from 'lucide-react'
import { Client } from '@/types/gallery'
import { DESCRIPTION_TEXTAREA_ROWS } from '@/lib/component-constants'

interface GalleryFormData {
  gallery_name: string
  gallery_description: string
  photographer_name: string
  session_date: string
  location: string
  people: string
  client_id: string
}

interface GalleryEditFormProps {
  formData: GalleryFormData
  setFormData: (data: GalleryFormData) => void
  clients: Client[]
  isPhotographer: boolean
}

export function GalleryEditForm({ formData, setFormData, clients, isPhotographer }: GalleryEditFormProps) {
  const handleInputChange = (field: keyof GalleryFormData, value: string) => {
    setFormData({
      ...formData,
      [field]: value
    })
  }

  return (
    <div className="space-y-6">
      {/* Gallery Name */}
      <div className="space-y-2">
        <Label htmlFor="gallery_name">Gallery Name</Label>
        <Input
          id="gallery_name"
          value={formData.gallery_name}
          onChange={(e) => handleInputChange('gallery_name', e.target.value)}
          placeholder="Enter gallery name"
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="gallery_description">Description</Label>
        <Textarea
          id="gallery_description"
          value={formData.gallery_description}
          onChange={(e) => handleInputChange('gallery_description', e.target.value)}
          placeholder="Enter gallery description"
          rows={DESCRIPTION_TEXTAREA_ROWS}
        />
      </div>

      {/* Photographer Name */}
      <div className="space-y-2">
        <Label htmlFor="photographer_name" className="flex items-center space-x-2">
          <User className="h-4 w-4" />
          <span>Photographer Name</span>
        </Label>
        <Input
          id="photographer_name"
          value={formData.photographer_name}
          onChange={(e) => handleInputChange('photographer_name', e.target.value)}
          placeholder="Enter photographer name"
        />
      </div>

      {/* Session Date */}
      <div className="space-y-2">
        <Label htmlFor="session_date" className="flex items-center space-x-2">
          <Calendar className="h-4 w-4" />
          <span>Session Date</span>
        </Label>
        <Input
          id="session_date"
          type="date"
          value={formData.session_date}
          onChange={(e) => handleInputChange('session_date', e.target.value)}
        />
      </div>

      {/* Location */}
      <div className="space-y-2">
        <Label htmlFor="location" className="flex items-center space-x-2">
          <MapPin className="h-4 w-4" />
          <span>Location</span>
        </Label>
        <Input
          id="location"
          value={formData.location}
          onChange={(e) => handleInputChange('location', e.target.value)}
          placeholder="Enter location"
        />
      </div>

      {/* People */}
      <div className="space-y-2">
        <Label htmlFor="people" className="flex items-center space-x-2">
          <Users className="h-4 w-4" />
          <span>People (comma-separated)</span>
        </Label>
        <Input
          id="people"
          value={formData.people}
          onChange={(e) => handleInputChange('people', e.target.value)}
          placeholder="Enter people names"
        />
      </div>

      {/* Client Selection (for photographers) */}
      {isPhotographer && (
        <div className="space-y-2">
          <Label htmlFor="client_id">Client</Label>
          <Select value={formData.client_id} onValueChange={(value) => handleInputChange('client_id', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select a client" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">No client assigned</SelectItem>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )
}
