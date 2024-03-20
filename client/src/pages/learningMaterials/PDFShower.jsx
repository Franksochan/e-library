import React, { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import PdfViewer from "./PDFViewer"
import api from "../../../utils/api"

export const SelectedPdfPage = () => {
  const [selectedPdf, setSelectedPdf] = useState([])
  const { materialID } = useParams()

  useEffect(() => {
    const fetchSelectedPdf = async () => {
      try {
        const response = await api.get(`/learning-materials/get-material/${materialID}`)
        setSelectedPdf(response.data.material)
        console.log(response.data.material.downloadUrl)
      } catch (err) {
        console.log(err)
      }
    }

    fetchSelectedPdf()
  }, [materialID])

  return (
    <div>
      {selectedPdf && <PdfViewer pdfUrl={`${selectedPdf.downloadUrl}`} />}
    </div>
  )
}

export default SelectedPdfPage 