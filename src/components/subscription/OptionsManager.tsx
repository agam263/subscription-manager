import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence, Variants } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useConfirmation } from '@/hooks/use-confirmation'

import { Trash2, Edit, Plus, Layers, CreditCard, Tag } from 'lucide-react'
import { useSubscriptionStore } from '@/store/subscriptionStore'
import { useToast } from '@/hooks/use-toast'

// Utility function to generate a safe value from a label that supports Unicode
function generateValue(label: string): string {
  const normalized = label
    .trim()
    .toLowerCase()
    .normalize('NFKC')

  const sanitized = normalized
    .replace(/\s+/g, '-') // Replace whitespace with hyphens
    .replace(/[^-\p{L}\p{N}]/gu, '') // Keep letters/numbers (including CJK) and hyphens

  return sanitized || `option-${Date.now()}`
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
}

const itemVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 15 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 350, damping: 25 }
  }
}

interface EditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  currentLabel: string
  onSave: (newName: string) => void
}

function EditDialog({ open, onOpenChange, title, currentLabel, onSave }: EditDialogProps) {
  const { t } = useTranslation(['common', 'settings'])
  const [name, setName] = useState(currentLabel)

  // Update internal state when dialog opens with a new label
  useEffect(() => {
    if (open) {
      setName(currentLabel)
    }
  }, [open, currentLabel])

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim())
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('settings:editOptionTitle', { type: title })}</DialogTitle>
          <DialogDescription>
            {t('settings:editOptionDesc', { type: title.toLowerCase() })}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">{t('common:name')}</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('settings:enterNamePlaceholder', { type: title.toLowerCase() })}
              className="bg-background/50"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && name.trim()) handleSave()
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common:cancel')}
          </Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            {t('common:save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface AddDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  onAdd: (name: string) => void
}

function AddDialog({ open, onOpenChange, title, onAdd }: AddDialogProps) {
  const { t } = useTranslation(['common', 'settings'])
  const [name, setName] = useState('')

  useEffect(() => {
    if (open) setName('')
  }, [open])

  const handleAdd = () => {
    if (name.trim()) {
      onAdd(name.trim())
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('settings:addOptionTitle', { type: title })}</DialogTitle>
          <DialogDescription>
            {t('settings:addOptionDesc', { type: title.toLowerCase() })}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="add-name">{t('common:name')}</Label>
            <Input
              id="add-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('settings:enterNamePlaceholder', { type: title.toLowerCase() })}
              className="bg-background/50"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && name.trim()) handleAdd()
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common:cancel')}
          </Button>
          <Button onClick={handleAdd} disabled={!name.trim()}>
            {t('settings:addOption', { type: title })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface OptionItemProps {
  value: string
  label: string
  type?: 'category' | 'payment'
  onEdit: () => void
  onDelete: () => void
  canDelete?: boolean
}

function OptionItem({ value, label, type = 'category', onEdit, onDelete, canDelete = true }: OptionItemProps) {
  const Icon = type === 'category' ? Layers : CreditCard

  return (
    <motion.div 
      variants={itemVariants}
      whileHover={{ y: -4, scale: 1.02 }}
      className="group relative flex flex-col justify-center p-4 border rounded-2xl transition-all duration-300 backdrop-blur-md overflow-hidden bg-background/50 border-foreground/10 hover:border-primary/40 hover:shadow-[0_0_20px_rgba(var(--primary),0.15)] hover:bg-primary/5"
    >
      {/* Decorative Background Icon */}
      <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-10 transition-opacity pointer-events-none transform group-hover:scale-110 duration-500">
        <Icon className="w-24 h-24 text-primary" />
      </div>

      <div className="relative z-10 flex flex-col">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 rounded-lg bg-foreground/5 text-foreground/70 group-hover:bg-primary/10 group-hover:text-primary transition-colors shadow-sm">
            <Icon className="w-4 h-4" />
          </div>
          <p className="font-bold text-foreground text-sm tracking-tight truncate">{label}</p>
        </div>
        <p className="text-[10px] text-muted-foreground font-mono bg-foreground/5 w-fit px-2 py-0.5 rounded-md border border-foreground/5 truncate max-w-[80%] uppercase tracking-wider">
          {value}
        </p>
      </div>

      <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-20">
        <Button variant="outline" size="icon" onClick={onEdit} className="h-7 w-7 rounded-full bg-background/90 backdrop-blur shadow-sm hover:bg-primary hover:text-primary-foreground border-foreground/10 hover:border-primary">
          <Edit className="h-3 w-3" />
        </Button>
        {canDelete && (
          <Button variant="outline" size="icon" onClick={onDelete} className="h-7 w-7 rounded-full bg-background/90 backdrop-blur shadow-sm hover:bg-destructive hover:text-destructive-foreground border-foreground/10 hover:border-destructive">
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>
    </motion.div>
  )
}

export function OptionsManager() {
  const { t } = useTranslation(['common', 'settings'])
  const { toast } = useToast()
  const {
    categories,
    paymentMethods,
    addCategory,
    editCategory,
    deleteCategory,
    addPaymentMethod,
    editPaymentMethod,
    deletePaymentMethod,
    fetchCategories,
    fetchPaymentMethods
  } = useSubscriptionStore()

  // Fetch data on component mount
  useEffect(() => {
    fetchCategories()
    fetchPaymentMethods()
  }, [fetchCategories, fetchPaymentMethods])

  // Dialog states
  const [editDialog, setEditDialog] = useState<{
    open: boolean
    type: 'category' | 'payment'
    value: string
    label: string
  }>({ open: false, type: 'category', value: '', label: '' })

  const [addDialog, setAddDialog] = useState<{
    open: boolean
    type: 'category' | 'payment'
  }>({ open: false, type: 'category' })
  
  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'category' | 'payment'; value: string; label: string } | null>(null)

  const handleEdit = (type: 'category' | 'payment', value: string, label: string) => {
    setEditDialog({ open: true, type, value, label })
  }

  const handleSaveEdit = async (newName: string) => {
    const { type, value: oldValue } = editDialog
    const newValue = generateValue(newName)
    // Find the existing option to get its ID
    const existingOption = type === 'category'
      ? categories.find(cat => cat.value === oldValue)
      : paymentMethods.find(method => method.value === oldValue)

    if (!existingOption) {
      toast({ title: t('common:error'), description: 'Option not found', variant: 'destructive' })
      return
    }

    const newOption = { id: existingOption.id, value: newValue, label: newName }

    try {
      switch (type) {
        case 'category':
          await editCategory(oldValue, newOption)
          break
        case 'payment':
          await editPaymentMethod(oldValue, newOption)
          break
      }

      toast({
        title: t('settings:optionUpdated'),
        description: t('settings:optionUpdateSuccess', { type: t(`settings:${type}`) })
      })
    } catch {
      toast({
        title: t('common:error'),
        description: t('settings:errorUpdatingOption', { type: t(`settings:${type}`) }),
        variant: "destructive"
      })
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    
    try {
      switch (deleteTarget.type) {
        case 'category':
          await deleteCategory(deleteTarget.value)
          break
        case 'payment':
          await deletePaymentMethod(deleteTarget.value)
          break
      }

      toast({
        title: t('settings:optionDeleted'),
        description: t('settings:optionDeleteSuccess', { type: t(`settings:${deleteTarget.type}`) })
      })
    } catch {
      toast({
        title: t('common:error'),
        description: t('settings:errorDeletingOption', { type: t(`settings:${deleteTarget.type}`) }),
        variant: "destructive"
      })
    }
    
    setDeleteTarget(null)
  }
  
  const deleteConfirmation = useConfirmation({
    title: deleteTarget?.type === 'category' ? t('settings:deleteCategory') : t('settings:deletePaymentMethod'),
    description: deleteTarget ? t('settings:deleteConfirmation', {
      name: deleteTarget.label,
      type: t(`settings:${deleteTarget.type}`)
    }) : "",
    confirmText: t('common:delete'),
    onConfirm: handleDelete,
  })
  
  const handleDeleteClick = (type: 'category' | 'payment', value: string, label: string) => {
    setDeleteTarget({ type, value, label })
    deleteConfirmation.openDialog()
  }

  const handleAdd = (type: 'category' | 'payment') => {
    setAddDialog({ open: true, type })
  }

  const handleSaveAdd = async (name: string) => {
    const { type } = addDialog
    const value = generateValue(name)
    const newOption = { id: 0, value, label: name }

    try {
      switch (type) {
        case 'category':
          await addCategory(newOption)
          break
        case 'payment':
          await addPaymentMethod(newOption)
          break
      }

      toast({
        title: t('settings:optionAdded'),
        description: t('settings:optionAddSuccess', { type: t(`settings:${type}`) })
      })
    } catch {
      toast({
        title: t('common:error'),
        description: t('settings:errorAddingOption', { type: t(`settings:${type}`) }),
        variant: "destructive"
      })
    }
  }

  return (
    <div className="space-y-6 pb-24">
      <Tabs defaultValue="categories" className="w-full">
        <TabsList className="grid w-full grid-cols-2 p-1 bg-background/50 backdrop-blur-md border border-foreground/10 rounded-xl mb-6 shadow-sm">
          <TabsTrigger value="categories" className="rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none transition-all">
            <Layers className="w-4 h-4 mr-2" />
            {t('settings:categories')}
          </TabsTrigger>
          <TabsTrigger value="payment-methods" className="rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none transition-all">
            <CreditCard className="w-4 h-4 mr-2" />
            {t('settings:paymentMethods')}
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <TabsContent value="categories" className="mt-0" forceMount>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <Card className="border-foreground/10 bg-background/40 backdrop-blur-xl shadow-lg relative overflow-hidden group/card">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none opacity-50 transition-opacity group-hover/card:opacity-100" />
                <CardHeader className="relative z-10 border-b border-foreground/5 bg-foreground/[0.02]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Tag className="w-5 h-5 text-primary" />
                        {t('settings:categories')}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {t('settings:manageCategoriesDesc')}
                      </CardDescription>
                    </div>
                    <Button onClick={() => handleAdd('category')} className="bg-primary/10 hover:bg-primary hover:text-primary-foreground text-primary border border-primary/20 shadow-none transition-all">
                      <Plus className="h-4 w-4 mr-2" />
                      {t('settings:addCategory')}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 relative z-10 min-h-[300px]">
                  <motion.div 
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {categories.map((category) => (
                      <OptionItem
                        key={category.value}
                        type="category"
                        value={category.value}
                        label={category.label}
                        onEdit={() => handleEdit('category', category.value, category.label)}
                        onDelete={() => handleDeleteClick('category', category.value, category.label)}
                        canDelete={categories.length > 1}
                      />
                    ))}
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="payment-methods" className="mt-0" forceMount>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <Card className="border-foreground/10 bg-background/40 backdrop-blur-xl shadow-lg relative overflow-hidden group/card">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none opacity-50 transition-opacity group-hover/card:opacity-100" />
                <CardHeader className="relative z-10 border-b border-foreground/5 bg-foreground/[0.02]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-primary" />
                        {t('settings:paymentMethods')}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {t('settings:managePaymentMethodsDesc')}
                      </CardDescription>
                    </div>
                    <Button onClick={() => handleAdd('payment')} className="bg-primary/10 hover:bg-primary hover:text-primary-foreground text-primary border border-primary/20 shadow-none transition-all">
                      <Plus className="h-4 w-4 mr-2" />
                      {t('settings:addPaymentMethod')}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 relative z-10 min-h-[300px]">
                  <motion.div 
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {paymentMethods.map((method) => (
                      <OptionItem
                        key={method.value}
                        type="payment"
                        value={method.value}
                        label={method.label}
                        onEdit={() => handleEdit('payment', method.value, method.label)}
                        onDelete={() => handleDeleteClick('payment', method.value, method.label)}
                        canDelete={paymentMethods.length > 1}
                      />
                    ))}
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </AnimatePresence>
      </Tabs>

      {/* Edit Dialog */}
      <EditDialog
        open={editDialog.open}
        onOpenChange={(open) => setEditDialog(prev => ({ ...prev, open }))}
        title={editDialog.type === 'category' ? t('settings:category') : editDialog.type === 'payment' ? t('settings:paymentMethod') : t('subscription:plan')}
        currentLabel={editDialog.label}
        onSave={handleSaveEdit}
      />

      {/* Add Dialog */}
      <AddDialog
        open={addDialog.open}
        onOpenChange={(open) => setAddDialog(prev => ({ ...prev, open }))}
        title={addDialog.type === 'category' ? t('settings:category') : addDialog.type === 'payment' ? t('settings:paymentMethod') : t('subscription:plan')}
        onAdd={handleSaveAdd}
      />
      
      {/* Delete Confirmation Dialog */}
      <ConfirmDialog {...deleteConfirmation.dialogProps} />
    </div>
  )
}
