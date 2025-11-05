# Blipee UI Components

Componentes reutilizáveis para a aplicação Blipee v2.

## 📦 Componentes de Modal

### BlipeeModal

Modal base simples e reutilizável.

**Uso básico:**

```tsx
import { BlipeeModal } from '@/components/ui'

<BlipeeModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="My Modal"
  subtitle="Optional subtitle"
  footer={
    <button onClick={handleSave}>Save</button>
  }
>
  <p>Modal content here</p>
</BlipeeModal>
```

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `isOpen` | `boolean` | ✓ | Controla visibilidade do modal |
| `onClose` | `() => void` | ✓ | Callback ao fechar modal |
| `title` | `string` | | Título do modal |
| `subtitle` | `string` | | Subtítulo do modal |
| `badges` | `ReactNode[]` | | Array de badges para mostrar no header |
| `children` | `ReactNode` | ✓ | Conteúdo do modal |
| `footer` | `ReactNode` | | Conteúdo do footer |
| `maxWidth` | `string` | | Largura máxima (default: '800px') |

---

### BlipeeMultiStepModal

Modal com suporte multi-step, indicador de progresso e botões de navegação automáticos.

**Uso completo:**

```tsx
import { BlipeeMultiStepModal } from '@/components/ui'

const steps = [
  { number: 1, title: 'Basic Info', icon: '📝' },
  { number: 2, title: 'Details', icon: '📋' },
  { number: 3, title: 'Review', icon: '✓' },
]

<BlipeeMultiStepModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Create New Item"
  steps={steps}
  currentStep={currentStep}
  onStepChange={setCurrentStep}
  isEditing={isEditing}
  canEdit={true}
  onEdit={() => setIsEditing(true)}
  onCancel={() => setIsEditing(false)}
  onSave={handleSave}
  onDelete={handleDelete}
  isSaving={isSaving}
  isDeleting={isDeleting}
  saveLabel="✓ Save Changes"
  deleteLabel="Delete"
>
  {renderStepContent()}
</BlipeeMultiStepModal>
```

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `isOpen` | `boolean` | ✓ | Controla visibilidade |
| `onClose` | `() => void` | ✓ | Callback ao fechar |
| `title` | `string` | | Título do modal |
| `subtitle` | `string` | | Subtítulo |
| `badges` | `ReactNode[]` | | Badges no header |
| `steps` | `Step[]` | ✓ | Array de steps |
| `currentStep` | `number` | ✓ | Step atual (1-indexed) |
| `onStepChange` | `(step: number) => void` | | Callback ao mudar step |
| `children` | `ReactNode` | ✓ | Conteúdo do step atual |
| `isEditing` | `boolean` | | Se está em modo edição |
| `canEdit` | `boolean` | | Se pode editar |
| `onEdit` | `() => void` | | Callback ao clicar Edit |
| `onCancel` | `() => void` | | Callback ao clicar Cancel |
| `onSave` | `() => void` | | Callback ao clicar Save |
| `onDelete` | `() => void` | | Callback ao clicar Delete |
| `onPrevious` | `() => void` | | Custom handler para Previous |
| `onNext` | `() => void` | | Custom handler para Next |
| `isSaving` | `boolean` | | Estado de saving |
| `isDeleting` | `boolean` | | Estado de deleting |
| `saveLabel` | `string` | | Label do botão save |
| `deleteLabel` | `string` | | Label do botão delete |
| `maxWidth` | `string` | | Largura máxima |

---

### BlipeeStepIndicator

Indicador de progresso para multi-step forms.

```tsx
import { BlipeeStepIndicator } from '@/components/ui'

const steps = [
  { number: 1, title: 'Step 1', icon: '1️⃣' },
  { number: 2, title: 'Step 2', icon: '2️⃣' },
]

<BlipeeStepIndicator
  steps={steps}
  currentStep={1}
  onStepClick={(step) => setCurrentStep(step)}
  clickable={true}
/>
```

---

### BlipeeModalFooter

Footer com botões configuráveis.

```tsx
import { BlipeeModalFooter } from '@/components/ui'

<BlipeeModalFooter
  leftButtons={[
    { label: 'Previous', onClick: handlePrev, variant: 'secondary' }
  ]}
  rightButtons={[
    { label: 'Cancel', onClick: handleCancel, variant: 'secondary' },
    { label: 'Save', onClick: handleSave, variant: 'primary', loading: isSaving }
  ]}
/>
```

---

## 🎨 Variantes de Botões

| Variant | Aparência |
|---------|-----------|
| `primary` | Verde com gradient |
| `secondary` | Transparente com borda |
| `danger` | Vermelho |

---

## 📚 Exemplos Completos

### Modal Simples de Confirmação

```tsx
function ConfirmModal() {
  return (
    <BlipeeModal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirm Action"
      footer={
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button onClick={onClose}>Cancel</button>
          <button onClick={onConfirm}>Confirm</button>
        </div>
      }
    >
      <p>Are you sure you want to proceed?</p>
    </BlipeeModal>
  )
}
```

### Modal Multi-Step Completo

```tsx
function CreateUserModal() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isEditing, setIsEditing] = useState(true)
  const [formData, setFormData] = useState({})

  const steps = [
    { number: 1, title: 'Personal Info', icon: '👤' },
    { number: 2, title: 'Account Details', icon: '🔐' },
  ]

  const handleSave = async () => {
    // Save logic
  }

  return (
    <BlipeeMultiStepModal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New User"
      steps={steps}
      currentStep={currentStep}
      onStepChange={setCurrentStep}
      isEditing={isEditing}
      onCancel={() => setIsEditing(false)}
      onSave={handleSave}
      saveLabel="Create User"
    >
      {currentStep === 1 && <PersonalInfoForm data={formData} onChange={setFormData} />}
      {currentStep === 2 && <AccountForm data={formData} onChange={setFormData} />}
    </BlipeeMultiStepModal>
  )
}
```

---

## 🎯 Comportamentos Automáticos

### Multi-Step Modal

**Modo Visualização** (`isEditing = false`):
- Botões Previous/Next à esquerda
- Botões Delete/Edit à direita (se `canEdit && onEdit && onDelete`)
- Previous disabled no primeiro step
- Next disabled no último step

**Modo Edição** (`isEditing = true`):
- Botão Previous à esquerda
- Botões Cancel + Next/Save à direita
- Previous disabled no primeiro step
- No último step: mostra Save em vez de Next
- Step indicator clicável

---

## 🔧 Customização

Todos os componentes usam CSS variables do tema:
- `--gradient-primary`: Botões primários
- `--green`: Step ativo
- `--red`: Botões de danger
- `--glass-border`: Bordas
- `--text-primary/secondary/tertiary`: Textos

---

## ✅ Checklist de Migração

Para migrar modais existentes:

1. Identifique tipo de modal (simples vs multi-step)
2. Use `BlipeeModal` para modais simples
3. Use `BlipeeMultiStepModal` para multi-step
4. Extraia lógica de botões para props
5. Remova código duplicado de overlay/container
6. Teste funcionalidade completa

---

**Versão**: 1.0.0
**Data**: Janeiro 2025
