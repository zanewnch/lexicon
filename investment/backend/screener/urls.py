from django.urls import path
from . import views

urlpatterns = [
    path("funnel/sectors/", views.FunnelSectorsView.as_view(), name="funnel-sectors"),
    path("funnel/layer2/", views.FunnelLayer2View.as_view(), name="funnel-layer2"),
    path("funnel/layer3/", views.FunnelLayer3View.as_view(), name="funnel-layer3"),
    path("tags/options/", views.TagOptionsView.as_view(), name="tags-options"),
    path("tags/filter/", views.TagFilterView.as_view(), name="tags-filter"),
    path("glossary/", views.GlossaryListView.as_view(), name="glossary-list"),
    path("glossary/search/", views.GlossarySearchView.as_view(), name="glossary-search"),
]
