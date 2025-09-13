import json

# Load the English file as reference
with open('src/messages/en.json', 'r', encoding='utf-8') as f:
    en_data = json.load(f)

# Load the corrupted Spanish file
with open('src/messages/es.json', 'r', encoding='utf-8') as f:
    content = f.read()

# Try to parse whatever we can
try:
    es_data = json.loads(content)
except json.JSONDecodeError as e:
    print(f"JSON parsing error at position {e.pos}: {e.msg}")
    # Try to fix common issues
    content_lines = content.splitlines()
    print(f"Error near line {len(content[:e.pos].splitlines())}")
    
# Get the devices section from English
devices_section = en_data.get('settings', {}).get('devices', {})

# Load a backup of Spanish if we have it
print("\nDevices section from English (to be translated):")
print(json.dumps(devices_section, indent=2, ensure_ascii=False)[:500])

# Check if Spanish file has devices in wrong place
print("\nSearching for Spanish devices translations...")

# Create fixed Spanish JSON from the parts we know are good
# First, let's find existing Spanish translations for devices
spanish_devices = {
    "title": "Gestión de Dispositivos",
    "subtitle": "Gestiona y monitorea todos tus dispositivos IoT en los sitios",
    "searchPlaceholder": "Buscar dispositivos...",
    "filter": "Filtrar",
    "addDevice": "Añadir Dispositivo",
    "createFirstDevice": "Añadir Tu Primer Dispositivo",
    "noDevicesFound": "No se encontraron dispositivos",
    "loadingDevices": "Cargando dispositivos...",
    "failedToDelete": "Error al eliminar dispositivo",
    "confirmDelete": "¿Estás seguro de que quieres eliminar {name}?",
    "pagination": {
        "showing": "Mostrando {start} a {end} de {total} dispositivos",
        "pageOf": "{current} / {total}"
    },
    "table": {
        "device": "Dispositivo",
        "type": "Tipo",
        "site": "Sitio",
        "details": "Detalles",
        "lastSeen": "Última Vez Visto",
        "status": "Estado",
        "serialNumber": "NS",
        "floor": "Piso",
        "justNow": "Ahora mismo",
        "minutesAgo": "{count} min atrás",
        "hoursAgo": "{count} hora{count, plural, =1 {} other {s}} atrás",
        "daysAgo": "{count} día{count, plural, =1 {} other {s}} atrás",
        "never": "Nunca"
    },
    "status": {
        "online": "en línea",
        "offline": "fuera de línea",
        "maintenance": "mantenimiento",
        "unknown": "desconocido"
    },
    "types": {
        "sensor": "Sensor",
        "meter": "Medidor de Energía",
        "hvac": "Sistema HVAC",
        "lighting": "Control de Iluminación",
        "solar": "Panel Solar",
        "battery": "Almacenamiento de Batería",
        "other": "Otro"
    },
    "protocols": {
        "modbus": "Modbus TCP",
        "bacnet": "BACnet",
        "mqtt": "MQTT",
        "opcua": "OPC UA",
        "api": "REST API"
    },
    "modal": {
        "addTitle": "Añadir Nuevo Dispositivo",
        "editTitle": "Editar Dispositivo",
        "viewTitle": "Ver Dispositivo",
        "sections": {
            "basicInfo": "Información Básica",
            "connectivity": "Conectividad",
            "location": "Ubicación y Asignación",
            "technical": "Detalles Técnicos"
        },
        "fields": {
            "name": "Nombre del Dispositivo",
            "namePlaceholder": "ej., Sensor de Temperatura Piso 1",
            "type": "Tipo de Dispositivo",
            "site": "Sitio",
            "manufacturer": "Fabricante",
            "manufacturerPlaceholder": "ej., Schneider Electric",
            "model": "Modelo",
            "modelPlaceholder": "ej., PM5560",
            "serialNumber": "Número de Serie",
            "serialNumberPlaceholder": "ej., SN123456789",
            "ipAddress": "Dirección IP",
            "ipAddressPlaceholder": "ej., 192.168.1.100",
            "macAddress": "Dirección MAC",
            "macAddressPlaceholder": "ej., 00:1B:44:11:3A:B7",
            "protocol": "Protocolo de Comunicación",
            "dataInterval": "Intervalo de Datos (minutos)",
            "dataIntervalPlaceholder": "5",
            "floor": "Piso",
            "floorPlaceholder": "ej., 1",
            "zone": "Zona",
            "zonePlaceholder": "ej., Ala Norte"
        },
        "actions": {
            "cancel": "Cancelar",
            "create": "Crear",
            "creating": "Creando...",
            "update": "Actualizar",
            "updating": "Actualizando...",
            "viewOnly": "Solo Vista"
        },
        "messages": {
            "createSuccess": "Dispositivo creado exitosamente",
            "updateSuccess": "Dispositivo actualizado exitosamente",
            "createError": "Error al crear dispositivo",
            "updateError": "Error al actualizar dispositivo"
        }
    }
}

print("\nSpanish devices section ready to insert")
print("Target location: settings.devices")