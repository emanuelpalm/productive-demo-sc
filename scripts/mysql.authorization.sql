select
	sy.system_name as consumer,
    s2.system_name as provider,
	sd.service_definition as service
from arrowhead.authorization_intra_cloud as ai
join arrowhead.system_ as sy on sy.id = ai.consumer_system_id
join arrowhead.system_ as s2 on s2.id = ai.provider_system_id
join arrowhead.service_definition as sd on sd.id = ai.service_id;