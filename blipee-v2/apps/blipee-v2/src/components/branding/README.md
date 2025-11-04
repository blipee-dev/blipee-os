# Blipee Branding Components

Componentes reutilizáveis para logos e branding do Blipee.

## BlipeeRobot

Componente do robô assistente Blipee com diferentes variantes.

### Uso Básico

```tsx
import { BlipeeRobot } from '@/components/branding'

// Robô padrão (landing page)
<BlipeeRobot />

// Com tamanho personalizado
<BlipeeRobot size={200} />

// Com blob de fundo
<BlipeeRobot variant="with-blob" size={300} />

// Versão maximizada (favicon)
<BlipeeRobot variant="maximized" size={100} />
```

### Props

- `variant`: `'default' | 'with-blob' | 'maximized'` - Variante do logo (default: 'default')
- `size`: `number | string` - Tamanho do logo (default: 120)
- `className`: `string` - Classe CSS adicional
- `style`: `React.CSSProperties` - Estilos inline adicionais

### Variantes

1. **default** - Robô da landing page (viewBox: 0 0 120 120)
2. **with-blob** - Robô com blob orgânico de fundo (viewBox: 0 0 340 340)
3. **maximized** - Robô maximizado para favicon (viewBox: 20 5 80 100)

## SVG Files

Os logos também estão disponíveis como SVG na pasta `logos/`:

- `robot.svg` - Robô padrão
- `robot-with-blob.svg` - Robô com blob
- `robot-maximized.svg` - Robô maximizado

## BlipeeLogo

Componente do logo textual Blipee (já existente).

```tsx
import { BlipeeLogo } from '@/components/branding'

<BlipeeLogo />
```
