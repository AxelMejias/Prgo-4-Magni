from io import BytesIO
from typing import Annotated, Optional
from fastapi import APIRouter, Query, Path, status
from fastapi.responses import StreamingResponse
import openpyxl

from app.schemas.ingrediente import IngredienteCreate, IngredienteUpdate, IngredienteResponse, PaginatedIngredientes
from app.services import ingrediente_service

router = APIRouter(prefix="/api/v1/ingredientes", tags=["Ingredientes"])


@router.get("/exportar", summary="Exportar ingredientes activos a Excel")
def exportar_ingredientes():
    ingredientes = ingrediente_service.get_all_activos_for_export()

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Ingredientes"
    ws.append(["ID", "Nombre", "Descripción", "Unidad de medida", "Es alérgeno", "Creado en"])

    for ing in ingredientes:
        ws.append([
            ing.id,
            ing.nombre,
            ing.descripcion or "",
            ing.unidad_medida,
            "Sí" if ing.es_alergeno else "No",
            ing.created_at.strftime("%Y-%m-%d %H:%M"),
        ])

    output = BytesIO()
    wb.save(output)
    output.seek(0)

    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=ingredientes.xlsx"},
    )


@router.get("/", response_model=PaginatedIngredientes, summary="Listar ingredientes")
def listar_ingredientes(
    nombre: Annotated[Optional[str], Query(max_length=100)] = None,
    unidad_medida: Annotated[Optional[str], Query(max_length=50)] = None,
    es_alergeno: Annotated[Optional[bool], Query()] = None,
    page: Annotated[int, Query(ge=1)] = 1,
    size: Annotated[int, Query(ge=1, le=100)] = 20,
):
    return ingrediente_service.get_all(
        nombre=nombre,
        es_alergeno=es_alergeno,
        unidad_medida=unidad_medida,
        page=page,
        size=size,
    )


@router.get("/{ingrediente_id}", response_model=IngredienteResponse, summary="Obtener ingrediente por ID")
def obtener_ingrediente(
    ingrediente_id: Annotated[int, Path(ge=1)],
):
    return ingrediente_service.get_by_id(ingrediente_id)


@router.post("/", response_model=IngredienteResponse, status_code=status.HTTP_201_CREATED, summary="Crear ingrediente")
def crear_ingrediente(data: IngredienteCreate):
    return ingrediente_service.create(data)


@router.put("/{ingrediente_id}", response_model=IngredienteResponse, summary="Actualizar ingrediente")
def actualizar_ingrediente(
    ingrediente_id: Annotated[int, Path(ge=1)],
    data: IngredienteUpdate,
):
    return ingrediente_service.update(ingrediente_id, data)


@router.delete("/{ingrediente_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Eliminar ingrediente (soft delete)")
def eliminar_ingrediente(
    ingrediente_id: Annotated[int, Path(ge=1)],
):
    ingrediente_service.delete(ingrediente_id)
